/**
 * Shared types for the local content engine.
 * Pure TypeScript. No React, no DOM, no network.
 */

export interface Segment {
  index: number;
  /** Seconds from the start of the recording, null for sources with no timestamps. */
  startSec: number | null;
  endSec: number | null;
  speaker: string | null;
  text: string;
}

export interface Sentence {
  index: number;
  segmentIndex: number;
  text: string;
  speaker: string | null;
  /** Interpolated from the containing segment, null when the source has no timestamps. */
  startSec: number | null;
  endSec: number | null;
  wordCount: number;
  /** Stemmed content terms, stopwords removed. */
  terms: string[];
}

export interface ParsedSource {
  kind: "transcript" | "article";
  hasTimestamps: boolean;
  segments: Segment[];
  sentences: Sentence[];
  speakers: string[];
  speakerTurns: number;
  wordCount: number;
  durationSec: number | null;
}

export interface Term {
  stem: string;
  /** Most frequent surface form of the stem, used as the display label. */
  label: string;
  score: number;
  df: number;
  count: number;
  idf: number;
}

export interface KeyPoint {
  sentenceIndex: number;
  text: string;
  score: number;
  timecode: string | null;
  speaker: string | null;
}

export interface QuotabilityFeature {
  label: string;
  value: number;
}

export interface ClipPick {
  rank: number;
  /** The sentence this clip was built around, so the citation can point at it. */
  sentenceIndex: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  timecode: string;
  quote: string;
  speaker: string | null;
  score: number;
  features: QuotabilityFeature[];
}

export interface CarouselSlide {
  index: number;
  kind: "cover" | "point" | "closing";
  eyebrow: string;
  headline: string;
  body: string;
  charCount: number;
  shortened: boolean;
  citation: Citation | null;
}

export interface Citation {
  label: string;
  sentenceIndex: number;
  timecode: string | null;
}

export type AssetId = "linkedin" | "carousel" | "clips" | "hooks" | "newsletter" | "report";

export interface AssetBase {
  id: AssetId;
  title: string;
  subtitle: string;
  /** 0 to 1, computed from measured engine signals, never a constant. */
  confidence: number;
  confidenceNote: string;
  citations: Citation[];
  notes: string[];
}

export interface LinkedInAsset extends AssetBase {
  id: "linkedin";
  hook: string;
  points: string[];
  question: string;
  text: string;
  charCount: number;
  charLimit: number;
}

export interface CarouselAsset extends AssetBase {
  id: "carousel";
  slides: CarouselSlide[];
  charCap: number;
  title: string;
}

export interface ClipsAsset extends AssetBase {
  id: "clips";
  available: boolean;
  unavailableReason: string | null;
  picks: ClipPick[];
}

export interface HookVariant {
  style: string;
  text: string;
  charCount: number;
  /** The sentence this variant was built from, or null for a composed variant. */
  sourceSentenceIndex: number | null;
}

export interface HooksAsset extends AssetBase {
  id: "hooks";
  variants: HookVariant[];
}

export interface NewsletterAsset extends AssetBase {
  id: "newsletter";
  paragraphs: string[];
  wordCount: number;
  targetWords: number;
}

export interface ReportTheme {
  label: string;
  evidence: string;
  timecode: string | null;
  speaker: string | null;
  supportCount: number;
  weight: number;
  sentenceIndex: number;
}

export interface ReportAsset extends AssetBase {
  id: "report";
  themes: ReportTheme[];
  headline: string;
}

export interface AssetBundle {
  generatedBy: "local" | "claude";
  sourceTitle: string;
  parsed: ParsedSource;
  terms: Term[];
  keyPoints: KeyPoint[];
  linkedin: LinkedInAsset;
  carousel: CarouselAsset;
  clips: ClipsAsset;
  hooks: HooksAsset;
  newsletter: NewsletterAsset;
  report: ReportAsset;
}

export interface FormatConstraints {
  linkedinCharLimit: number;
  slideCharCap: number;
  slideCount: number;
  hookCount: number;
  hookCharCap: number;
  newsletterWords: number;
  clipCount: number;
  clipMinSec: number;
  clipMaxSec: number;
  themeCount: number;
}

export const DEFAULT_CONSTRAINTS: FormatConstraints = {
  linkedinCharLimit: 3000,
  slideCharCap: 120,
  slideCount: 5,
  hookCount: 6,
  hookCharCap: 140,
  newsletterWords: 120,
  clipCount: 3,
  clipMinSec: 12,
  clipMaxSec: 75,
  themeCount: 4,
};

export type PipelineStageId =
  | "parse"
  | "terms"
  | "rank"
  | "quote"
  | "render"
  | "queue";

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
}
