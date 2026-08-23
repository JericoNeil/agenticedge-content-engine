/**
 * The local content engine.
 *
 * Pipeline: parse, TF-IDF, TextRank centrality, quotability scoring, asset
 * composition. Pure TypeScript, no React, no network, no model. The same input
 * always produces the same output.
 */

import { parseSource } from "./parse";
import { buildTfidf, weightTermsByCentrality } from "./tfidf";
import { selectDiverse, textRank } from "./textrank";
import { pickClips, scoreSentences } from "./quotability";
import { composeAssets, deriveTitle } from "./compose";
import { formatTimecode } from "./text";
import {
  DEFAULT_CONSTRAINTS,
  type AssetBundle,
  type ClipPick,
  type FormatConstraints,
  type KeyPoint,
  type ParsedSource,
  type Term,
} from "./types";

export * from "./types";
export { parseSource } from "./parse";
export { formatTimecode, shortenTo, wordCount } from "./text";

export interface EngineStats {
  segments: number;
  sentences: number;
  vocabulary: number;
  graphEdges: number;
  iterations: number;
  converged: boolean;
  clipCandidates: number;
}

export interface Analysis {
  parsed: ParsedSource;
  terms: Term[];
  /** The whole weighted vocabulary. The UI shows only the head of this list. */
  allTerms: Term[];
  keyPoints: KeyPoint[];
  clips: ClipPick[];
  centrality: number[];
  title: string;
  stats: EngineStats;
  constraints: FormatConstraints;
}

export interface EngineOptions {
  sourceTitle?: string;
  constraints?: Partial<FormatConstraints>;
  topTerms?: number;
  keyPointCount?: number;
}

/** Everything up to composition. Live mode reuses this, then asks Claude to write. */
export function analyze(raw: string, options: EngineOptions = {}): Analysis {
  const constraints: FormatConstraints = { ...DEFAULT_CONSTRAINTS, ...(options.constraints ?? {}) };
  const parsed = parseSource(raw);
  const model = buildTfidf(parsed.sentences);
  const rank = textRank(model.vectors);

  const wordCounts = parsed.sentences.map((s) => s.wordCount);
  // Questions are useful as hooks but make poor key points, so they are held
  // back here and used by the hook builder instead.
  const eligible = parsed.sentences.map((s) =>
    s.text.trim().endsWith("?") ? 0 : rank.normalised[s.index] ?? 0,
  );

  const chosen = selectDiverse(model.vectors, eligible, wordCounts, {
    count: options.keyPointCount ?? 6,
    minWords: 8,
    maxWords: 45,
    redundancyLimit: 0.42,
  });

  const keyPoints: KeyPoint[] = chosen.map((i) => ({
    sentenceIndex: i,
    text: parsed.sentences[i].text,
    score: rank.normalised[i] ?? 0,
    timecode: formatTimecode(parsed.sentences[i].startSec),
    speaker: parsed.sentences[i].speaker,
  }));

  const scored = scoreSentences(parsed, rank.normalised);
  const clips = pickClips(parsed, scored, {
    count: constraints.clipCount,
    minSec: constraints.clipMinSec,
    maxSec: constraints.clipMaxSec,
  });

  const allTerms = weightTermsByCentrality(model.terms, parsed.sentences, rank.normalised);
  const terms = allTerms.slice(0, options.topTerms ?? 8);
  const title = options.sourceTitle?.trim() || deriveTitle(parsed, terms);

  return {
    parsed,
    terms,
    allTerms,
    keyPoints,
    clips,
    centrality: rank.normalised,
    title,
    constraints,
    stats: {
      segments: parsed.segments.length,
      sentences: parsed.sentences.length,
      vocabulary: model.vocabularySize,
      graphEdges: rank.edges,
      iterations: rank.iterations,
      converged: rank.converged,
      clipCandidates: scored.filter((s) => s.score > 0.35).length,
    },
  };
}

export function runLocalEngine(
  raw: string,
  options: EngineOptions = {},
): { bundle: AssetBundle; analysis: Analysis } {
  const analysis = analyze(raw, options);
  const composed = composeAssets({
    parsed: analysis.parsed,
    terms: analysis.terms,
    allTerms: analysis.allTerms,
    keyPoints: analysis.keyPoints,
    clips: analysis.clips,
    centrality: analysis.centrality,
    sourceTitle: analysis.title,
    constraints: analysis.constraints,
  });
  return { bundle: { ...composed, generatedBy: "local" }, analysis };
}

export interface StageReport {
  index: number;
  total: number;
  label: string;
}

/**
 * Stage labels for the progress display. Each label reports work that really
 * happened, with the counts the engine actually measured.
 */
export function stageLabels(analysis: Analysis): string[] {
  return [
    `Parsing ${analysis.stats.segments} segments`,
    `Extracting terms (${analysis.stats.vocabulary} unique stems)`,
    `Ranking sentences (${analysis.stats.sentences} nodes, ${analysis.stats.graphEdges} edges)`,
    analysis.parsed.hasTimestamps
      ? `Scoring quotability (${analysis.stats.clipCandidates} candidates)`
      : "Scoring quotability (no timestamps, clips skipped)",
    "Rendering to locked template (6 assets)",
    "Queueing for review (6 pending)",
  ];
}
