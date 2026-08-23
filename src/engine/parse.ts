/**
 * Source parsing.
 *
 * Handles two shapes with one code path:
 *   1. A timestamped transcript, "[12:04] Speaker name: text".
 *   2. A plain article with no timestamps and no speakers.
 *
 * Sentence level timestamps are interpolated inside the containing segment by
 * character offset. That is an estimate and the UI says so, but the segment
 * boundaries themselves are read straight from the source, never invented.
 */

import type { ParsedSource, Segment, Sentence } from "./types";
import { contentTerms, splitSentences, wordCount } from "./text";

const TIMESTAMP = /^\s*[\[(]?(\d{1,3}):(\d{2})(?::(\d{2}))?[\])]?\s*/;
const SPEAKER = /^([^:\n]{1,44}):\s+/;

/** Words per second used only to close the final segment, which has no successor. */
const SPEECH_RATE = 2.6;

function parseSpeaker(rest: string): { speaker: string | null; text: string } {
  const m = rest.match(SPEAKER);
  if (!m) return { speaker: null, text: rest.trim() };
  const candidate = m[1].trim();
  const words = candidate.split(/\s+/);
  const looksLikeName =
    words.length <= 5 &&
    candidate.length <= 44 &&
    !/[.!?]$/.test(candidate) &&
    /^[A-ZÀ-Ý]/.test(candidate);
  if (!looksLikeName) return { speaker: null, text: rest.trim() };
  return { speaker: candidate, text: rest.slice(m[0].length).trim() };
}

function toSeconds(m: RegExpMatchArray): number {
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = m[3] === undefined ? null : Number(m[3]);
  return c === null ? a * 60 + b : a * 3600 + b * 60 + c;
}

export function parseSource(raw: string): ParsedSource {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const hasTimestamps = lines.some((l) => TIMESTAMP.test(l));

  const segments: Segment[] = [];

  if (hasTimestamps) {
    let current: Segment | null = null;
    let lastSpeaker: string | null = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      const ts = trimmed.match(TIMESTAMP);
      if (ts) {
        const rest = trimmed.slice(ts[0].length);
        const { speaker, text } = parseSpeaker(rest);
        const resolved: string | null = speaker ?? lastSpeaker;
        lastSpeaker = resolved;
        current = {
          index: segments.length,
          startSec: toSeconds(ts),
          endSec: null,
          speaker: resolved,
          text,
        };
        segments.push(current);
      } else if (current) {
        current.text = `${current.text} ${trimmed}`.trim();
      } else {
        // Text before the first timestamp, for example a title line.
        const { speaker, text } = parseSpeaker(trimmed);
        current = {
          index: 0,
          startSec: 0,
          endSec: null,
          speaker,
          text,
        };
        segments.push(current);
      }
    }
  } else {
    const paragraphs = raw
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 0);
    paragraphs.forEach((text, index) => {
      segments.push({ index, startSec: null, endSec: null, speaker: null, text });
    });
  }

  // Close every segment. All but the last take the next segment's start time.
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    if (seg.startSec === null) continue;
    const next = segments[i + 1];
    if (next && next.startSec !== null) {
      seg.endSec = Math.max(seg.startSec, next.startSec);
    } else {
      const spoken = wordCount(seg.text) / SPEECH_RATE;
      seg.endSec = seg.startSec + Math.max(3, Math.round(spoken));
    }
  }

  const sentences: Sentence[] = [];
  for (const seg of segments) {
    const spans = splitSentences(seg.text);
    const segLength = Math.max(1, seg.text.length);
    const segStart = seg.startSec;
    const segEnd = seg.endSec;
    for (const span of spans) {
      const words = wordCount(span.text);
      if (words === 0) continue;
      let startSec: number | null = null;
      let endSec: number | null = null;
      if (segStart !== null && segEnd !== null) {
        const segDuration = segEnd - segStart;
        startSec = segStart + (span.start / segLength) * segDuration;
        endSec = segStart + (span.end / segLength) * segDuration;
      }
      sentences.push({
        index: sentences.length,
        segmentIndex: seg.index,
        text: span.text,
        speaker: seg.speaker,
        startSec,
        endSec,
        wordCount: words,
        terms: contentTerms(span.text),
      });
    }
  }

  const speakers: string[] = [];
  let turns = 0;
  let previous: string | null = null;
  for (const seg of segments) {
    if (seg.speaker && !speakers.includes(seg.speaker)) speakers.push(seg.speaker);
    if (seg.speaker && seg.speaker !== previous) turns += 1;
    previous = seg.speaker;
  }

  const totalWords = segments.reduce((sum, s) => sum + wordCount(s.text), 0);
  const last = segments[segments.length - 1];
  const durationSec = last && last.endSec !== null ? last.endSec : null;

  return {
    kind: hasTimestamps ? "transcript" : "article",
    hasTimestamps,
    segments,
    sentences,
    speakers,
    speakerTurns: turns,
    wordCount: totalWords,
    durationSec,
  };
}
