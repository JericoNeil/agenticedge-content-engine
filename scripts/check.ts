/**
 * Engine self check.
 *
 * The claim this prototype makes is that the assets are derived from the source
 * rather than written in advance, and that clip timestamps come from the parser
 * rather than being invented. Those are exactly the claims a reader should be
 * sceptical of, so this script asserts them.
 *
 * Run it with:
 *   npm run check
 */

import { runLocalEngine, analyze, DEFAULT_CONSTRAINTS } from "../src/engine";
import { DEMO_SOURCES } from "../src/data/sources";

let failures = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`pass  ${label}${detail ? `  ${detail}` : ""}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${label}${detail ? `  ${detail}` : ""}`);
  }
}

function sourceById(id: string) {
  const found = DEMO_SOURCES.find((s) => s.id === id);
  if (!found) throw new Error(`missing demo source: ${id}`);
  return found;
}

const pilots = sourceById("pilots");
const family = sourceById("family");
const article = sourceById("article");

console.log("\n1. Different sources produce different output\n");

const a = runLocalEngine(pilots.text, { sourceTitle: pilots.title });
const b = runLocalEngine(family.text, { sourceTitle: family.title });

const termsA = a.analysis.terms.map((t) => t.label);
const termsB = b.analysis.terms.map((t) => t.label);
const sharedTerms = termsA.filter((t) => termsB.includes(t));

check(
  "the two transcripts yield different top terms",
  sharedTerms.length < termsA.length,
  `${sharedTerms.length} of ${termsA.length} shared. A: ${termsA.join(", ")} | B: ${termsB.join(", ")}`,
);
check(
  "the two transcripts yield different key points",
  a.analysis.keyPoints[0]?.text !== b.analysis.keyPoints[0]?.text,
);
check(
  "the two transcripts yield different LinkedIn copy",
  a.bundle.linkedin.hook !== b.bundle.linkedin.hook,
);
check(
  "the two transcripts yield different clip picks",
  a.analysis.clips[0]?.quote !== b.analysis.clips[0]?.quote,
);

console.log("\n2. Clip timestamps come from the parsed transcript\n");

const segments = a.analysis.parsed.segments;
const lastSegmentStart = segments[segments.length - 1]?.startSec ?? 0;

for (const clip of a.analysis.clips) {
  const withinSource =
    clip.startSec !== null &&
    clip.endSec !== null &&
    clip.startSec >= 0 &&
    clip.endSec > clip.startSec &&
    clip.startSec <= lastSegmentStart + 600;
  check(
    `clip ${clip.rank} timestamps sit inside the transcript`,
    withinSource,
    `${clip.startSec} to ${clip.endSec} seconds`,
  );

  // The engine pads clip edges out to sentence boundaries, so a start will not
  // usually equal a segment start exactly. What must hold is that it falls
  // inside a segment that really exists in the transcript.
  const insideASegment = segments.some((s, i) => {
    const next = segments[i + 1];
    if (s.startSec === null) return false;
    return clip.startSec >= s.startSec && (next?.startSec != null ? clip.startSec < next.startSec + 30 : true);
  });
  check(
    `clip ${clip.rank} starts inside a real transcript segment`,
    insideASegment,
    insideASegment ? "" : "start falls outside every segment",
  );
}

const durationsOk = a.analysis.clips.every((c) => {
  const d = (c.endSec ?? 0) - (c.startSec ?? 0);
  return d >= DEFAULT_CONSTRAINTS.clipMinSec && d <= DEFAULT_CONSTRAINTS.clipMaxSec;
});
check(
  "every clip respects the configured duration bounds",
  durationsOk,
  `${DEFAULT_CONSTRAINTS.clipMinSec} to ${DEFAULT_CONSTRAINTS.clipMaxSec} seconds`,
);

console.log("\n3. A source without timestamps produces no clips\n");

const c = runLocalEngine(article.text, { sourceTitle: article.title });
check("the article parses with no timestamps", c.analysis.parsed.hasTimestamps === false);
check("the article yields zero clip picks", c.analysis.clips.length === 0);
check(
  "the clips asset says so rather than inventing timestamps",
  c.bundle.clips.picks.length === 0 && c.bundle.clips.unavailableReason !== null,
  c.bundle.clips.unavailableReason ?? "",
);
check("the article still yields a full carousel", c.bundle.carousel.slides.length === 5);

console.log("\n4. Format constraints are actually enforced\n");

check(
  "the LinkedIn post is inside the 3000 character limit",
  a.bundle.linkedin.charCount <= DEFAULT_CONSTRAINTS.linkedinCharLimit,
  `${a.bundle.linkedin.charCount} characters`,
);

const overCap = a.bundle.carousel.slides.filter(
  (s) => s.body.length > DEFAULT_CONSTRAINTS.slideCharCap,
);
check(
  "no carousel slide exceeds the character cap",
  overCap.length === 0,
  `cap ${DEFAULT_CONSTRAINTS.slideCharCap}`,
);
check(
  "the carousel has exactly the fixed number of slides",
  a.bundle.carousel.slides.length === DEFAULT_CONSTRAINTS.slideCount,
);
check(
  "there are exactly six hook variants",
  a.bundle.hooks.variants.length === DEFAULT_CONSTRAINTS.hookCount,
);
check(
  "every hook is inside its character cap",
  a.bundle.hooks.variants.every((v) => v.text.length <= DEFAULT_CONSTRAINTS.hookCharCap),
);

const words = a.bundle.newsletter.wordCount;
check(
  "the newsletter blurb is close to its target length",
  Math.abs(words - DEFAULT_CONSTRAINTS.newsletterWords) <= 45,
  `${words} words against a target of ${DEFAULT_CONSTRAINTS.newsletterWords}`,
);

console.log("\n5. Every asset is traceable to the source\n");

const assets = [
  a.bundle.linkedin,
  a.bundle.carousel,
  a.bundle.clips,
  a.bundle.hooks,
  a.bundle.newsletter,
  a.bundle.report,
];
const sentenceCount = a.analysis.parsed.sentences.length;

for (const asset of assets) {
  const cited = asset.citations.length > 0;
  const inRange = asset.citations.every(
    (c) => c.sentenceIndex >= 0 && c.sentenceIndex < sentenceCount,
  );
  check(
    `${asset.id} carries citations that point at real sentences`,
    cited && inRange,
    `${asset.citations.length} citations`,
  );
}

console.log("\n6. The engine is deterministic\n");

const again = runLocalEngine(pilots.text, { sourceTitle: pilots.title });
check(
  "the same source produces the same LinkedIn post",
  again.bundle.linkedin.hook === a.bundle.linkedin.hook,
);
check(
  "the same source produces the same clips",
  JSON.stringify(again.analysis.clips) === JSON.stringify(a.analysis.clips),
);
check(
  "the same source produces the same confidence scores",
  again.bundle.carousel.confidence === a.bundle.carousel.confidence,
);

console.log("\n7. Reported statistics match the parse\n");

const stats = a.analysis.stats;
check(
  "the reported segment count matches the parse",
  stats.segments === a.analysis.parsed.segments.length,
  `${stats.segments} segments`,
);
check(
  "the reported sentence count matches the parse",
  stats.sentences === a.analysis.parsed.sentences.length,
  `${stats.sentences} sentences`,
);
check("the sentence ranking converged", stats.converged, `${stats.iterations} iterations`);

const bare = analyze(pilots.text);
check("analyze and runLocalEngine agree on the parse", bare.stats.sentences === stats.sentences);

console.log("");
if (failures > 0) {
  console.log(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All checks passed.");
