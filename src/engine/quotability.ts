/**
 * Quotability scoring for clip picks.
 *
 * Every feature here is measured on the sentence itself. Nothing is sampled and
 * nothing is guessed. The timestamps come from the parsed segments, so a clip
 * pick can always be checked against the recording.
 */

import type { ClipPick, ParsedSource, QuotabilityFeature, Sentence } from "./types";
import {
  formatTimecode,
  hasClaimVerb,
  hasFigure,
  startsWithConnective,
  startsWithPronoun,
} from "./text";

export interface ScoredSentence {
  sentenceIndex: number;
  score: number;
  features: QuotabilityFeature[];
}

const WEIGHTS = {
  length: 0.2,
  selfContained: 0.2,
  claim: 0.2,
  cleanTurn: 0.15,
  centrality: 0.25,
};

/** Full marks between 12 and 32 words, tapering outside that band. */
export function lengthScore(words: number): number {
  if (words >= 12 && words <= 32) return 1;
  if (words < 12) return Math.max(0, (words - 4) / 8);
  return Math.max(0, 1 - (words - 32) / 24);
}

export function selfContainedScore(text: string): number {
  let score = 1;
  if (startsWithPronoun(text)) score -= 0.65;
  if (startsWithConnective(text)) score -= 0.45;
  if (/^[a-z]/.test(text)) score -= 0.2;
  return Math.max(0, score);
}

export function claimScore(text: string): number {
  const figure = hasFigure(text) ? 0.6 : 0;
  const verb = hasClaimVerb(text) ? 0.5 : 0;
  return Math.min(1, figure + verb);
}

/**
 * A clip is only usable if the sentence sits inside one speaker turn with no
 * crosstalk. Short segments are interjections, and a segment ending without
 * terminal punctuation is a sentence the other speaker talked over.
 */
export function cleanTurnScore(sentence: Sentence, parsed: ParsedSource): number {
  const segment = parsed.segments[sentence.segmentIndex];
  if (!segment) return 0;
  const segmentWords = segment.text.split(/\s+/).filter(Boolean).length;
  let score = 1;
  if (segmentWords < 10) score -= 0.7;
  else if (segmentWords < 18) score -= 0.25;
  if (!/[.!?]["'”’)]?$/.test(sentence.text)) score -= 0.5;
  return Math.max(0, score);
}

export function scoreSentences(
  parsed: ParsedSource,
  centrality: number[],
): ScoredSentence[] {
  return parsed.sentences.map((s) => {
    const features: QuotabilityFeature[] = [
      { label: "Length 12 to 32 words", value: lengthScore(s.wordCount) },
      { label: "Self contained opening", value: selfContainedScore(s.text) },
      { label: "Figure or claim verb", value: claimScore(s.text) },
      { label: "Single turn, no crosstalk", value: cleanTurnScore(s, parsed) },
      { label: "Centrality", value: centrality[s.index] ?? 0 },
    ];
    const score =
      features[0].value * WEIGHTS.length +
      features[1].value * WEIGHTS.selfContained +
      features[2].value * WEIGHTS.claim +
      features[3].value * WEIGHTS.cleanTurn +
      features[4].value * WEIGHTS.centrality;
    return { sentenceIndex: s.index, score, features };
  });
}

export interface ClipOptions {
  count: number;
  minSec: number;
  maxSec: number;
}

/**
 * Take the highest scoring sentences, expand each one to whole sentence
 * boundaries inside the same speaker turn until the clip is long enough to be
 * usable, and reject any pick whose time window overlaps one already taken.
 */
export function pickClips(
  parsed: ParsedSource,
  scored: ScoredSentence[],
  options: ClipOptions,
): ClipPick[] {
  if (!parsed.hasTimestamps) return [];

  const order = [...scored].sort(
    (a, b) => b.score - a.score || a.sentenceIndex - b.sentenceIndex,
  );
  const picks: ClipPick[] = [];
  const takenSegments = new Set<number>();

  for (const candidate of order) {
    if (picks.length >= options.count) break;
    const core = parsed.sentences[candidate.sentenceIndex];
    if (!core || core.startSec === null || core.endSec === null) continue;
    if (takenSegments.has(core.segmentIndex)) continue;
    if (core.wordCount < 8) continue;

    let start = core.startSec;
    let end = core.endSec;
    let cursor = core.index;

    // Pad forward to the next sentence boundary in the same turn while the clip
    // is still shorter than a usable clip.
    while (end - start < options.minSec) {
      const next = parsed.sentences[cursor + 1];
      if (!next || next.segmentIndex !== core.segmentIndex || next.endSec === null) break;
      if (next.endSec - start > options.maxSec) break;
      end = next.endSec;
      cursor += 1;
    }
    // If it is still short, pad backwards.
    if (end - start < options.minSec) {
      const previous = parsed.sentences[core.index - 1];
      if (
        previous &&
        previous.segmentIndex === core.segmentIndex &&
        previous.startSec !== null &&
        end - previous.startSec <= options.maxSec
      ) {
        start = previous.startSec;
      }
    }

    start = Math.floor(start);
    end = Math.min(Math.ceil(end), start + options.maxSec);
    if (end - start < 5) continue;

    const overlaps = picks.some((p) => start < p.endSec && end > p.startSec);
    if (overlaps) continue;

    takenSegments.add(core.segmentIndex);
    picks.push({
      rank: picks.length + 1,
      sentenceIndex: core.index,
      startSec: start,
      endSec: end,
      durationSec: end - start,
      timecode: `${formatTimecode(start)} to ${formatTimecode(end)}`,
      quote: core.text,
      speaker: core.speaker,
      score: candidate.score,
      features: candidate.features,
    });
  }

  picks.sort((a, b) => a.startSec - b.startSec);
  picks.forEach((p, i) => {
    p.rank = i + 1;
  });
  return picks;
}
