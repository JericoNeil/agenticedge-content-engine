/**
 * Asset composition.
 *
 * Every asset is assembled from material the earlier stages extracted: ranked
 * sentences, weighted terms, scored clip picks. The per format constraints
 * (character limits, slide caps, word budgets) are enforced here by real code,
 * and when the engine has to shorten something it records that it did.
 */

import type {
  AssetBundle,
  CarouselAsset,
  CarouselSlide,
  Citation,
  ClipPick,
  ClipsAsset,
  FormatConstraints,
  HookVariant,
  HooksAsset,
  KeyPoint,
  LinkedInAsset,
  NewsletterAsset,
  ParsedSource,
  ReportAsset,
  ReportTheme,
  Term,
} from "./types";
import {
  STOPWORDS,
  formatTimecode,
  normaliseWord,
  shortenTo,
  stem,
  stripFillers,
  titleCase,
  wordCount,
} from "./text";

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

function citationFor(parsed: ParsedSource, sentenceIndex: number): Citation {
  const s = parsed.sentences[sentenceIndex];
  const timecode = s ? formatTimecode(s.startSec) : null;
  return {
    sentenceIndex,
    timecode,
    label: timecode ? `[${timecode}]` : `S${sentenceIndex + 1}`,
  };
}

/**
 * Short slide headline drawn from the sentence itself. It picks the most
 * distinctive recurring term in the sentence, measured by inverse document
 * frequency, and extends it to a two word phrase when the next word is also a
 * content word. Nothing here is written by hand.
 */
function phraseFor(
  parsed: ParsedSource,
  sentenceIndex: number,
  allTerms: Term[],
  taken: Set<string>,
): { phrase: string; stem: string } {
  const sentence = parsed.sentences[sentenceIndex];
  if (!sentence) return { phrase: "Key point", stem: "" };
  const byStem = new Map(allTerms.map((t) => [t.stem, t]));
  const words = sentence.text.split(/\s+/);
  const clean = (w: string) => (w ?? "").replace(/[^A-Za-z0-9À-ɏ'’]/g, "");
  const isContent = (w: string) => {
    const n = normaliseWord(clean(w));
    return n.length > 3 && !STOPWORDS.has(n) && stem(n).length > 2;
  };

  let best: { term: Term; i: number; weight: number } | null = null;
  for (const stemmed of new Set(sentence.terms)) {
    const term = byStem.get(stemmed);
    if (!term || term.df < 2 || taken.has(stemmed)) continue;
    // Distinctive and recurring, rather than simply rare.
    const weight = term.idf * (1 + Math.log(term.count));
    if (best && weight <= best.weight) continue;
    const i = words.findIndex((w) => stem(normaliseWord(clean(w))) === stemmed);
    if (i < 0) continue;
    best = { term, i, weight };
  }

  if (!best) {
    const fallback = words.slice(0, 2).map(clean).filter(Boolean).join(" ");
    return { phrase: titleCase(fallback.toLowerCase()) || "Key point", stem: "" };
  }

  const head = clean(words[best.i]);
  const before = clean(words[best.i - 1] ?? "");
  const after = clean(words[best.i + 1] ?? "");
  let phrase = head;
  if (isContent(before)) phrase = `${before} ${head}`;
  else if (isContent(after)) phrase = `${head} ${after}`;

  return { phrase: titleCase(phrase.toLowerCase()).slice(0, 28), stem: best.term.stem };
}

function hashtagsFrom(terms: Term[], count: number): string[] {
  return terms
    .slice(0, count)
    .map((t) => `#${titleCase(t.label.replace(/[^A-Za-z0-9]/g, "").toLowerCase())}`)
    .filter((h) => h.length > 3);
}

export interface ComposeInput {
  parsed: ParsedSource;
  terms: Term[];
  allTerms: Term[];
  keyPoints: KeyPoint[];
  clips: ClipPick[];
  centrality: number[];
  sourceTitle: string;
  constraints: FormatConstraints;
}

export function deriveTitle(parsed: ParsedSource, terms: Term[]): string {
  const first = parsed.sentences[0];
  if (first && first.wordCount <= 12 && !/[.!?]$/.test(first.text)) return first.text;
  const labels = terms.slice(0, 2).map((t) => titleCase(t.label));
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return labels[0] ?? "Untitled source";
}

/* ------------------------------------------------------------------ hooks */

function buildHooks(input: ComposeInput): HooksAsset {
  const { parsed, terms, keyPoints, clips, constraints, centrality } = input;
  const cap = constraints.hookCharCap;
  const t = terms.map((x) => x.label);
  const variants: HookVariant[] = [];
  const citations: Citation[] = [];
  const notes: string[] = [];
  let derived = 0;

  const push = (style: string, text: string, sentenceIndex: number | null) => {
    const result = shortenTo(text, cap);
    variants.push({
      style,
      text: result.text,
      charCount: result.text.length,
      sourceSentenceIndex: sentenceIndex,
    });
    if (sentenceIndex !== null) {
      citations.push(citationFor(parsed, sentenceIndex));
      derived += 1;
    }
  };

  // 1. Statement. The highest ranked key point that fits the cap without being
  // cut, because a hook that ends in an ellipsis is not a hook.
  const statement =
    keyPoints.find((k) => stripFillers(k.text).length <= cap) ?? keyPoints[0];
  if (statement) push("Statement", stripFillers(statement.text), statement.sentenceIndex);

  // 2. Question, taken from a real question in the source when there is one.
  const questions = parsed.sentences
    .filter((s) => s.text.trim().endsWith("?") && s.wordCount >= 6 && s.wordCount <= 26)
    .sort((a, b) => (centrality[b.index] ?? 0) - (centrality[a.index] ?? 0));
  if (questions[0]) {
    push("Question from the source", stripFillers(questions[0].text), questions[0].index);
  } else if (t[0]) {
    push("Question", `What does it take to make ${t[0]} work?`, null);
    notes.push("No question sentence in the source, so the question hook uses the top topic.");
  }

  // 3. Figure, the most central sentence carrying a number.
  const figure = parsed.sentences
    .filter((s) => /\d/.test(s.text) && s.wordCount >= 8 && s.wordCount <= 34)
    .sort((a, b) => (centrality[b.index] ?? 0) - (centrality[a.index] ?? 0))[0];
  if (figure) push("Figure", stripFillers(figure.text), figure.index);

  // 4. Pull quote from the best clip, or from the second key point.
  if (clips[0]) {
    const attribution = clips[0].speaker ? ` ${clips[0].speaker}` : "";
    // Shorten inside the quote marks, never across them.
    const inner = shortenTo(stripFillers(clips[0].quote), cap - attribution.length - 2).text;
    push("Pull quote", `"${inner}"${attribution}`, null);
    derived += 1;
  } else if (keyPoints[1]) {
    const inner = shortenTo(stripFillers(keyPoints[1].text), cap - 2).text;
    push("Pull quote", `"${inner}"`, keyPoints[1].sentenceIndex);
  }

  // 5. List, built from the top weighted topics.
  if (t.length >= 3) {
    const kind = parsed.kind === "transcript" ? "episode" : "article";
    push("Topic list", `Three things from this ${kind}: ${t[0]}, ${t[1]} and ${t[2]}.`, null);
    derived += 1;
  }

  // 6. Direct address, framing the second key point.
  if (keyPoints[1] && t[0]) {
    const short = shortenTo(stripFillers(keyPoints[1].text), 88).text;
    push("Direct", `If ${t[0]} is on your roadmap, start here: ${short}`, keyPoints[1].sentenceIndex);
  }

  // Top up from the remaining key points if a style had no material.
  let fill = 2;
  while (variants.length < constraints.hookCount && keyPoints[fill]) {
    push("Statement", stripFillers(keyPoints[fill].text), keyPoints[fill].sentenceIndex);
    fill += 1;
  }

  const meanLength =
    variants.reduce((sum, v) => sum + Math.min(1, v.charCount / cap), 0) /
    Math.max(1, variants.length);
  const confidence = clamp(0.45 + 0.35 * (derived / Math.max(1, variants.length)) + 0.2 * meanLength);

  return {
    id: "hooks",
    title: "Hook variants",
    subtitle: `${variants.length} alternatives, ${cap} character cap`,
    confidence,
    confidenceNote: `${derived} of ${variants.length} variants map to a specific sentence in the source.`,
    citations,
    notes,
    variants,
  };
}

/* --------------------------------------------------------------- linkedin */

function buildLinkedIn(input: ComposeInput, hooks: HooksAsset): LinkedInAsset {
  const { parsed, terms, keyPoints, constraints } = input;
  const limit = constraints.linkedinCharLimit;
  const notes: string[] = [];
  const hook = hooks.variants[0]?.text ?? "";
  // The hook already carries one key point, so the body takes the next three.
  const hookIndex = hooks.variants[0]?.sourceSentenceIndex ?? -1;
  const bodyPoints = keyPoints.filter((k) => k.sentenceIndex !== hookIndex).slice(0, 3);
  const points = bodyPoints.map((kp) => {
    const result = shortenTo(stripFillers(kp.text), 220);
    if (result.shortened) notes.push(`Point shortened to 220 characters (${result.method}).`);
    return result.text;
  });
  const t = terms.map((x) => x.label);
  const question =
    t.length >= 2
      ? `Which one blocks you first, ${t[0]} or ${t[1]}?`
      : "Which part of this matches what you are seeing?";

  const hashtags = hashtagsFrom(terms, 3).concat("#LeadingInAI");
  const body = points.map((p, i) => `${i + 1}. ${p}`).join("\n\n");
  let text = `${hook}\n\n${body}\n\n${question}\n\n${hashtags.join(" ")}`;

  if (text.length > limit) {
    text = `${hook}\n\n${body}\n\n${question}`;
    notes.push("Hashtags dropped to stay inside the 3000 character limit.");
  }
  if (text.length > limit) {
    text = `${text.slice(0, limit - 3).trimEnd()}...`;
    notes.push("Body truncated to the 3000 character limit.");
  }

  const meanCentrality =
    bodyPoints.reduce((sum, kp) => sum + kp.score, 0) / Math.max(1, bodyPoints.length);
  const confidence = clamp(0.5 + 0.45 * meanCentrality - (notes.length > 2 ? 0.1 : 0));

  return {
    id: "linkedin",
    title: "LinkedIn post",
    subtitle: "Hook, three points, closing question",
    confidence,
    confidenceNote: `Mean centrality of the three points is ${meanCentrality.toFixed(2)}.`,
    citations: [keyPoints[0], ...bodyPoints]
      .filter(Boolean)
      .map((kp) => citationFor(parsed, kp.sentenceIndex)),
    notes,
    hook,
    points,
    question,
    text,
    charCount: text.length,
    charLimit: limit,
  };
}

/* --------------------------------------------------------------- carousel */

function buildCarousel(input: ComposeInput, question: string): CarouselAsset {
  const { parsed, terms, allTerms, keyPoints, constraints, sourceTitle } = input;
  const cap = constraints.slideCharCap;
  const notes: string[] = [];
  const slides: CarouselSlide[] = [];
  const citations: Citation[] = [];
  let shortenedCount = 0;

  const coverBody = terms
    .slice(0, 3)
    .map((x) => x.label)
    .join(" / ");
  const coverHeadline = shortenTo(sourceTitle, 64);
  slides.push({
    index: 0,
    kind: "cover",
    eyebrow: parsed.kind === "transcript" ? "Episode insight" : "Article insight",
    headline: coverHeadline.text,
    body: coverBody,
    charCount: coverHeadline.text.length,
    shortened: coverHeadline.shortened,
    citation: null,
  });

  const takenHeadlines = new Set<string>();
  keyPoints.slice(0, 3).forEach((kp, i) => {
    const result = shortenTo(stripFillers(kp.text), cap);
    const headline = phraseFor(parsed, kp.sentenceIndex, allTerms, takenHeadlines);
    if (headline.stem) takenHeadlines.add(headline.stem);
    if (result.shortened) {
      shortenedCount += 1;
      notes.push(
        `Slide ${i + 2} exceeded the ${cap} character cap and was shortened (${result.method}).`,
      );
    }
    const citation = citationFor(parsed, kp.sentenceIndex);
    citations.push(citation);
    slides.push({
      index: slides.length,
      kind: "point",
      eyebrow: `Point ${String(i + 1).padStart(2, "0")} of 03`,
      headline: headline.phrase,
      body: result.text,
      charCount: result.text.length,
      shortened: result.shortened,
      citation,
    });
  });

  const closing = shortenTo(question, cap);
  slides.push({
    index: slides.length,
    kind: "closing",
    eyebrow: "Over to you",
    headline: closing.text,
    body: "",
    charCount: closing.text.length,
    shortened: closing.shortened,
    citation: null,
  });

  const meanCentrality =
    keyPoints.slice(0, 3).reduce((sum, kp) => sum + kp.score, 0) / Math.max(1, Math.min(3, keyPoints.length));
  const confidence = clamp(0.5 + 0.45 * meanCentrality - 0.07 * shortenedCount);

  return {
    id: "carousel",
    title: "Carousel, five slides",
    subtitle: `${cap} characters per slide, locked template`,
    confidence,
    confidenceNote:
      shortenedCount > 0
        ? `${shortenedCount} slide body text was shortened to fit the ${cap} character cap.`
        : `Every slide fitted the ${cap} character cap without shortening.`,
    citations,
    notes,
    slides,
    charCap: cap,
  };
}

/* ------------------------------------------------------------------ clips */

function buildClips(input: ComposeInput): ClipsAsset {
  const { parsed, clips, constraints } = input;
  if (!parsed.hasTimestamps) {
    return {
      id: "clips",
      title: "Clip picks",
      subtitle: "Not available for this source",
      confidence: 0.2,
      confidenceNote: "No timestamps in the source, so no clip can be cut.",
      citations: [],
      notes: [
        "This source has no timestamps, so the engine cannot cut clips from it.",
        "Timestamps are never invented. Upload a timed transcript to get clip picks.",
      ],
      available: false,
      unavailableReason:
        "This source has no timestamps. The engine will not guess a start and end time, so clip picks are unavailable. Use a timed transcript for clips.",
      picks: [],
    };
  }

  const mean = clips.reduce((sum, c) => sum + c.score, 0) / Math.max(1, clips.length);
  const shortfall = clips.length < constraints.clipCount;
  return {
    id: "clips",
    title: "Clip picks",
    subtitle: `${clips.length} picks, timestamps read from the transcript`,
    confidence: clamp(mean * 1.15),
    confidenceNote: `Mean quotability score across the picks is ${mean.toFixed(2)}.`,
    citations: clips.map((c) => ({
      label: `[${formatTimecode(c.startSec)}]`,
      sentenceIndex: c.sentenceIndex,
      timecode: formatTimecode(c.startSec),
    })),
    notes: shortfall
      ? [`Only ${clips.length} non overlapping picks cleared the scoring threshold.`]
      : [],
    available: true,
    unavailableReason: null,
    picks: clips,
  };
}

/* ------------------------------------------------------------- newsletter */

function fitToWordBudget(paragraphs: string[], target: number): { text: string[]; trimmed: boolean } {
  const out = [...paragraphs];
  let trimmed = false;
  const total = () => out.reduce((sum, p) => sum + wordCount(p), 0);

  while (total() > target + 12 && out.length > 1) {
    const longest = out.reduce((best, p, i) => (wordCount(p) > wordCount(out[best]) ? i : best), 0);
    const sentences = out[longest].split(/(?<=[.!?])\s+/);
    if (sentences.length <= 1) break;
    sentences.pop();
    out[longest] = sentences.join(" ").trim();
    trimmed = true;
  }

  if (total() > target + 12) {
    const last = out.length - 1;
    const words = out[last].split(/\s+/);
    const excess = total() - target;
    out[last] = `${words.slice(0, Math.max(6, words.length - excess)).join(" ")}...`;
    trimmed = true;
  }

  return { text: out.filter((p) => p.trim().length > 0), trimmed };
}

function buildNewsletter(input: ComposeInput, question: string): NewsletterAsset {
  const { parsed, keyPoints, constraints, sourceTitle, terms } = input;
  const target = constraints.newsletterWords;
  const speaker = parsed.speakers.find((s) => s.toLowerCase() !== "host") ?? null;
  const opening =
    parsed.kind === "transcript" && speaker
      ? `${sourceTitle}. In this episode, ${speaker} makes the case:`
      : `${sourceTitle}. The short version:`;

  const closing = `${question} Topics: ${terms.slice(0, 3).map((t) => t.label).join(", ")}.`;
  const closingWords = wordCount(closing);
  const kp = keyPoints.map((k) => stripFillers(k.text));

  // Fill the body with as many ranked key points as the word budget allows.
  const body: string[] = [];
  let used = wordCount(opening) + closingWords;
  for (const point of kp) {
    const cost = wordCount(point);
    if (body.length > 0 && used + cost > target + 12) break;
    body.push(point);
    used += cost;
    if (used >= target - 8) break;
  }

  const paragraphs = [
    `${opening} ${body[0] ?? ""}`.trim(),
    body.slice(1).join(" "),
    closing,
  ];

  const fitted = fitToWordBudget(paragraphs, target);
  const words = fitted.text.reduce((sum, p) => sum + wordCount(p), 0);
  const drift = Math.abs(words - target) / target;

  return {
    id: "newsletter",
    title: "Newsletter blurb",
    subtitle: `Target ${target} words`,
    confidence: clamp(0.95 - drift * 1.6),
    confidenceNote: `${words} words against a ${target} word target, drift ${(drift * 100).toFixed(0)} per cent.`,
    citations: keyPoints.slice(0, 3).map((k) => citationFor(parsed, k.sentenceIndex)),
    notes: fitted.trimmed ? ["Trimmed to hold the word budget."] : [],
    paragraphs: fitted.text,
    wordCount: words,
    targetWords: target,
  };
}

/* ----------------------------------------------------------------- report */

function buildReport(input: ComposeInput): ReportAsset {
  const { parsed, terms, constraints, centrality } = input;
  const themes: ReportTheme[] = [];
  const used = new Set<number>();
  const maxTermScore = terms[0]?.score ?? 1;

  for (const term of terms) {
    if (themes.length >= constraints.themeCount) break;
    // Evidence has to be a statement, so questions from the interviewer are out.
    const candidates = parsed.sentences
      .filter(
        (s) =>
          s.terms.includes(term.stem) &&
          s.wordCount >= 8 &&
          !s.text.trim().endsWith("?") &&
          !used.has(s.index),
      )
      .sort((a, b) => (centrality[b.index] ?? 0) - (centrality[a.index] ?? 0));
    const evidence = candidates[0];
    if (!evidence) continue;
    used.add(evidence.index);
    themes.push({
      label: titleCase(term.label),
      evidence: stripFillers(evidence.text),
      timecode: formatTimecode(evidence.startSec),
      speaker: evidence.speaker,
      supportCount: term.df,
      weight: term.score / (maxTermScore || 1),
      sentenceIndex: evidence.index,
    });
  }

  const meanSupport = themes.reduce((sum, t) => sum + t.supportCount, 0) / Math.max(1, themes.length);
  const confidence = clamp(
    0.35 + Math.min(0.4, meanSupport / 16) + 0.15 * (themes.length / Math.max(1, constraints.themeCount)),
  );

  return {
    id: "report",
    title: "Insight report",
    subtitle: `${themes.length} themes with evidence`,
    confidence,
    confidenceNote: `Each theme is supported by ${meanSupport.toFixed(1)} sentences on average.`,
    citations: themes.map((t) => citationFor(parsed, t.sentenceIndex)),
    notes: [],
    themes,
    headline: `${themes.length} themes across ${parsed.sentences.length} sentences`,
  };
}

/* ------------------------------------------------------------------ build */

export function composeAssets(input: ComposeInput): Omit<AssetBundle, "generatedBy"> {
  const hooks = buildHooks(input);
  const linkedin = buildLinkedIn(input, hooks);
  const carousel = buildCarousel(input, linkedin.question);
  const clips = buildClips(input);
  const newsletter = buildNewsletter(input, linkedin.question);
  const report = buildReport(input);

  return {
    sourceTitle: input.sourceTitle,
    parsed: input.parsed,
    terms: input.terms,
    keyPoints: input.keyPoints,
    linkedin,
    carousel,
    clips,
    hooks,
    newsletter,
    report,
  };
}
