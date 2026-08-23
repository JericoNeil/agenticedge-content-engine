/**
 * Optional live mode.
 *
 * The local engine still does the analysis. Claude is only asked to write, and
 * it is given the extracted themes, quotes, timestamps and the format
 * constraints as input. The response has to match the local engine's asset
 * contract, so the same components render both modes.
 *
 * Clip timestamps are never taken from the model. They are read from the local
 * parser and copied into the result after the model replies, because a language
 * model must not be trusted to state where something happens in a recording.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AssetBundle } from "../engine";
import { shortenTo, wordCount } from "../engine";
import type { Analysis } from "../engine";
import type { BrandKit } from "../data/brand";

export const KEY_STORAGE = "ae_anthropic_key";

const SYSTEM_PROMPT = `You are the copywriting stage of the Agentic Edge Marketing Content Engine.

A local analysis engine has already parsed the source, ranked its sentences and
picked the clips. You do not analyse and you do not invent facts. You rewrite
the supplied material into the requested formats.

Hard rules:
1. Use only the supplied key points, quotes and topics. Never add a fact, a
   figure, a name or a claim that is not in the supplied material.
2. Never output a timestamp. Timestamps come from the local parser.
3. Never use an em dash or an en dash. Use commas, colons, semicolons or a full
   stop.
4. Respect every character and word limit given in the request.
5. Reply with one JSON object and nothing else. No prose, no code fence.

JSON contract:
{
  "linkedin": { "hook": string, "points": [string, string, string], "question": string },
  "carousel": { "slides": [ { "eyebrow": string, "headline": string, "body": string } x5 ] },
  "hooks": [ { "style": string, "text": string } x6 ],
  "newsletter": { "paragraphs": [string, string, string] },
  "report": { "themes": [ { "label": string, "evidence": string } ] }
}

The carousel is always five slides in this order: cover, three point slides,
closing slide. The report themes must keep the same order and the same count as
the supplied themes, and each evidence line must be a faithful compression of
the supplied evidence sentence.`;

export function buildUserContent(
  analysis: Analysis,
  bundle: AssetBundle,
  brand: BrandKit,
): string {
  const c = analysis.constraints;
  const lines: string[] = [];
  lines.push(`SOURCE TITLE: ${analysis.title}`);
  lines.push(
    `SOURCE TYPE: ${analysis.parsed.kind}, ${analysis.parsed.wordCount} words, ${analysis.parsed.sentences.length} sentences.`,
  );
  lines.push("");
  lines.push("TOPICS BY WEIGHT:");
  analysis.terms.forEach((t) => lines.push(`- ${t.label} (weight ${t.score.toFixed(1)}, ${t.df} sentences)`));
  lines.push("");
  lines.push("KEY POINTS, HIGHEST CENTRALITY FIRST:");
  analysis.keyPoints.forEach((k, i) =>
    lines.push(`${i + 1}. ${k.timecode ? `[${k.timecode}] ` : ""}${k.text}`),
  );
  lines.push("");
  if (analysis.clips.length > 0) {
    lines.push("SELECTED QUOTES, FOR REFERENCE ONLY, DO NOT REPEAT THE TIMESTAMPS:");
    analysis.clips.forEach((clip) => lines.push(`- ${clip.speaker ?? "Speaker"}: ${clip.quote}`));
    lines.push("");
  }
  lines.push("THEMES WITH EVIDENCE:");
  bundle.report.themes.forEach((t) => lines.push(`- ${t.label}: ${t.evidence}`));
  lines.push("");
  lines.push("BRAND:");
  lines.push(`- Name: ${brand.name}`);
  lines.push(`- Tagline: ${brand.tagline}`);
  lines.push(`- Call to action already on the closing slide: ${brand.cta}`);
  lines.push("");
  lines.push("FORMAT CONSTRAINTS, ENFORCED AFTER YOU REPLY:");
  lines.push(`- LinkedIn post: hook, three points, one closing question, ${c.linkedinCharLimit} characters maximum in total.`);
  lines.push(`- Carousel: ${c.slideCount} slides, body text ${c.slideCharCap} characters maximum per slide, headline 28 characters maximum.`);
  lines.push(`- Hooks: ${c.hookCount} variants, ${c.hookCharCap} characters maximum each.`);
  lines.push(`- Newsletter: about ${c.newsletterWords} words in total across the paragraphs.`);
  lines.push(`- Report: ${bundle.report.themes.length} themes, one evidence line each, 200 characters maximum.`);
  return lines.join("\n");
}

/** Pull the first balanced JSON object out of a stream of text. */
export function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  if (start < 0) throw new Error("No JSON object in the response");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(raw.slice(start, i + 1));
    }
  }
  throw new Error("Unbalanced JSON in the response");
}

const asString = (v: unknown, fallback: string): string =>
  typeof v === "string" && v.trim().length > 0 ? v.replace(/[\u2013\u2014]/g, ",").trim() : fallback;

/**
 * Merge a model reply into the locally generated bundle. Anything the model did
 * not supply, or supplied badly, keeps the local value. Clips, citations,
 * timestamps and every measured count are recomputed locally.
 */
export function mergeLiveResult(local: AssetBundle, parsed: unknown): AssetBundle {
  const data = parsed as Record<string, any>;
  const next: AssetBundle = JSON.parse(JSON.stringify(local));
  next.generatedBy = "claude";
  // Clips are carried over by reference from the local engine, never from the model.
  next.clips = local.clips;
  next.parsed = local.parsed;

  const li = data?.linkedin ?? {};
  next.linkedin.hook = asString(li.hook, local.linkedin.hook);
  if (Array.isArray(li.points)) {
    next.linkedin.points = local.linkedin.points.map((p, i) => asString(li.points[i], p));
  }
  next.linkedin.question = asString(li.question, local.linkedin.question);
  next.linkedin.text = `${next.linkedin.hook}\n\n${next.linkedin.points
    .map((p, i) => `${i + 1}. ${p}`)
    .join("\n\n")}\n\n${next.linkedin.question}`;
  if (next.linkedin.text.length > next.linkedin.charLimit) {
    next.linkedin.text = `${next.linkedin.text.slice(0, next.linkedin.charLimit - 3)}...`;
    next.linkedin.notes = [...next.linkedin.notes, "Live output truncated to the character limit."];
  }
  next.linkedin.charCount = next.linkedin.text.length;

  const slides = data?.carousel?.slides;
  if (Array.isArray(slides)) {
    next.carousel.slides = local.carousel.slides.map((slide, i) => {
      const incoming = slides[i] ?? {};
      const headline = asString(incoming.headline, slide.headline).slice(0, 64);
      const bodyRaw = asString(incoming.body, slide.body);
      const fitted = shortenTo(bodyRaw, local.carousel.charCap);
      return {
        ...slide,
        eyebrow: asString(incoming.eyebrow, slide.eyebrow).slice(0, 28),
        headline,
        body: fitted.text,
        charCount: Math.max(headline.length, fitted.text.length),
        shortened: fitted.shortened,
      };
    });
  }

  if (Array.isArray(data?.hooks)) {
    next.hooks.variants = local.hooks.variants.map((v, i) => {
      const incoming = data.hooks[i] ?? {};
      const text = shortenTo(asString(incoming.text, v.text), 140).text;
      return {
        style: asString(incoming.style, v.style),
        text,
        charCount: text.length,
        sourceSentenceIndex: v.sourceSentenceIndex,
      };
    });
  }

  const paragraphs = data?.newsletter?.paragraphs;
  if (Array.isArray(paragraphs)) {
    const cleaned = paragraphs
      .map((p: unknown) => asString(p, ""))
      .filter((p: string) => p.length > 0);
    if (cleaned.length > 0) {
      next.newsletter.paragraphs = cleaned;
      next.newsletter.wordCount = cleaned.reduce((sum, p) => sum + wordCount(p), 0);
    }
  }

  const themes = data?.report?.themes;
  if (Array.isArray(themes)) {
    next.report.themes = local.report.themes.map((t, i) => ({
      ...t,
      label: asString(themes[i]?.label, t.label),
      evidence: shortenTo(asString(themes[i]?.evidence, t.evidence), 200).text,
    }));
  }

  return next;
}

export interface LiveRunOptions {
  apiKey: string;
  analysis: Analysis;
  localBundle: AssetBundle;
  brand: BrandKit;
  onDelta?: (chunk: string, total: number) => void;
}

export async function generateWithClaude(options: LiveRunOptions): Promise<AssetBundle> {
  const client = new Anthropic({
    apiKey: options.apiKey,
    dangerouslyAllowBrowser: true,
    defaultHeaders: { "anthropic-dangerous-direct-browser-access": "true" },
  });

  // output_config is newer than the pinned SDK's request types, so the params
  // are cast to the stream signature. The field is sent as written.
  const params = {
    model: "claude-opus-5",
    max_tokens: 8000,
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user" as const,
        content: buildUserContent(options.analysis, options.localBundle, options.brand),
      },
    ],
  };

  const stream = client.messages.stream(
    params as unknown as Parameters<typeof client.messages.stream>[0],
  );

  let text = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
      options.onDelta?.(event.delta.text, text.length);
    }
  }

  return mergeLiveResult(options.localBundle, extractJson(text));
}
