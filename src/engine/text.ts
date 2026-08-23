/**
 * Tokenisation, stopwords, a light suffix stripping stemmer and sentence
 * splitting. All of it deterministic: the same input always yields the same
 * output, which is what the recorded demo needs.
 */

export const STOPWORDS = new Set<string>(
  (
    "a about above after again against all almost also although always am among an and another any anybody " +
    "anyone anything are around as at back be became because become been before behind being below between " +
    "both but by came can cannot come could did do does doing done down during each either else enough etc " +
    "even ever every everybody everyone everything few for from further get gets getting give given go goes " +
    "going gone got had has have having he her here hers herself him himself his how however i if in indeed " +
    "instead into is it its itself just keep kept know known lot made make makes making many may maybe me " +
    "mean means meant might mine more most much must my myself near need needs neither never new next no " +
    "nobody none nor not nothing now of off often on once one only or other others otherwise our ours " +
    "ourselves out over own perhaps put quite rather really right said same say says see seen seem seems " +
    "several shall she should since so some somebody someone something sometimes still such take taken than " +
    "that the their theirs them themselves then there therefore these they thing things think this those " +
    "though through thus to together too toward towards two under until up upon us use used uses using " +
    "usually very want wants was way we well went were what whatever when where whether which while who whom " +
    "whose why will with within without would yeah yes yet you your yours yourself okay ok kind sort bit " +
    "actually basically literally obviously honestly anyway sure lots stuff thanks thank welcome hello hi " +
    "look looks looking talk talking talked tell told let lets us re ve ll doesnt dont didnt isnt arent " +
    "wasnt werent cant wont im ive id youre theyre thats whats theres heres its " +
    // Number words and units of time carry no topic signal, they are detail.
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen " +
    "seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand " +
    "million billion half twice double single per cent percent " +
    "thing things part parts way ways lot time times day days week weeks month months year years " +
    "minute minutes hour hours people person number numbers everybody nobody anybody today tomorrow " +
    "yesterday week month year ago long short big small good bad better best worse"
  ).split(/\s+/),
);

const CLAIM_VERBS = new Set<string>(
  (
    "beats blocks breaks builds burns buys costs cuts decides delivers depends destroys doubles drives " +
    "drops earns eliminates fails falls fixes forces grows halves ignores increases kills lands leaks " +
    "loses matters misses moves multiplies needs pays predicts prevents proves reduces removes replaces " +
    "requires returns rises saves scales sells shifts shrinks signs solves speeds spends stalls stops " +
    "survives takes triples wins works wastes wins"
  ).split(/\s+/),
);

const LEADING_PRONOUNS = new Set<string>(
  "it its it's they them their that this these those he she him her his hers we our us you your".split(/\s+/),
);

const DISCOURSE_OPENERS = new Set<string>(
  (
    "and but so or because however therefore also then well yeah yes right okay ok anyway although though " +
    "plus besides meanwhile still moreover furthermore actually basically honestly obviously sure exactly " +
    "again first second third finally now"
  ).split(/\s+/),
);

const ABBREVIATIONS = new Set<string>(
  "mr mrs ms dr prof sr sra st vs etc inc ltd co approx fig eg ie no vol dept jr".split(/\s+/),
);

/** Ordered suffix list. Longest first so the longest match wins. */
const SUFFIXES = [
  "ationally",
  "izations",
  "ization",
  "ational",
  "fulness",
  "ousness",
  "iveness",
  "abilities",
  "ability",
  "ibility",
  "ations",
  "ingly",
  "edly",
  "fully",
  "ation",
  "ities",
  "ments",
  "ness",
  "ment",
  "ance",
  "ence",
  "able",
  "ible",
  "ally",
  "ing",
  "ers",
  "est",
  "ive",
  "ful",
  "ity",
  "ily",
  "ed",
  "ly",
  "er",
  "al",
];

export function normaliseWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[‘’']/g, "'")
    .replace(/[^a-z0-9'%]/g, "");
}

/**
 * Light suffix stripping stemmer. Not Porter, deliberately smaller and easier
 * to reason about. It only strips when the remaining stem stays readable.
 */
export function stem(word: string): string {
  let w = word.replace(/'s$/, "").replace(/'/g, "");
  if (w.length <= 3) return w;

  if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("ies") && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith("ss")) {
    /* keep, "process" must not become "proces" */
  } else if (w.endsWith("s") && !w.endsWith("us") && !w.endsWith("is")) w = w.slice(0, -1);

  for (const suffix of SUFFIXES) {
    if (w.length - suffix.length >= 4 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }

  // Undo the doubled consonant that English adds before ed and ing.
  if (/([bdfgklmnprt])\1$/.test(w)) w = w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .split(/[^A-Za-z0-9%À-ɏ'’]+/)
    .map(normaliseWord)
    .filter((w) => w.length > 0);
}

export function contentTerms(text: string): string[] {
  return tokenize(text)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
    .map(stem)
    .filter((w) => w.length > 2);
}

export function wordCount(text: string): number {
  const m = text.trim().match(/[A-Za-z0-9À-ɏ][A-Za-z0-9À-ɏ'’%.,-]*/g);
  return m ? m.length : 0;
}

export interface SentenceSpan {
  text: string;
  start: number;
  end: number;
}

/**
 * Sentence splitter that respects abbreviations, decimal numbers and initials.
 * Returns character offsets so the caller can interpolate a timestamp.
 */
export function splitSentences(text: string): SentenceSpan[] {
  const spans: SentenceSpan[] = [];
  let cursor = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;

    // A run of terminators counts as one boundary.
    let j = i;
    while (j + 1 < text.length && /[.!?]/.test(text[j + 1])) j += 1;

    const after = text.slice(j + 1, j + 3);
    const isEnd = j + 1 >= text.length;
    const followedByBreak = /^["'“‘)\]]?\s/.test(after) || after === "";
    if (!isEnd && !followedByBreak) {
      i = j;
      continue;
    }

    const before = text.slice(cursor, i + 1);
    const lastWord = (before.match(/([A-Za-zÀ-ɏ.]+)\.$/) || [])[1];
    if (ch === "." && lastWord) {
      const bare = lastWord.replace(/\./g, "").toLowerCase();
      if (ABBREVIATIONS.has(bare) || bare.length === 1) {
        i = j;
        continue;
      }
    }
    if (ch === "." && /\d$/.test(text.slice(0, i)) && /^\s?\d/.test(text.slice(j + 1))) {
      i = j;
      continue;
    }

    const raw = text.slice(cursor, j + 1);
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const offset = raw.indexOf(trimmed[0]);
      spans.push({
        text: trimmed,
        start: cursor + Math.max(0, offset),
        end: j + 1,
      });
    }
    cursor = j + 1;
    i = j;
  }

  const tail = text.slice(cursor).trim();
  if (tail.length > 0) {
    const offset = text.slice(cursor).indexOf(tail[0]);
    spans.push({ text: tail, start: cursor + Math.max(0, offset), end: text.length });
  }
  return spans;
}

export function formatTimecode(seconds: number | null): string | null {
  if (seconds === null || Number.isNaN(seconds)) return null;
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function hasClaimVerb(text: string): boolean {
  return tokenize(text).some((w) => CLAIM_VERBS.has(w));
}

export function hasFigure(text: string): boolean {
  return /(\d|per cent|percent|%|\bhalf\b|\btwice\b|\bdouble\b|\bthird\b|\bquarter\b)/i.test(text);
}

export function startsWithPronoun(text: string): boolean {
  const first = normaliseWord(text.split(/\s+/)[0] || "");
  return LEADING_PRONOUNS.has(first);
}

export function startsWithConnective(text: string): boolean {
  const first = normaliseWord(text.split(/\s+/)[0] || "");
  return DISCOURSE_OPENERS.has(first);
}

/** Title case a single word or short label without touching acronyms. */
export function titleCase(text: string): string {
  return text.replace(/\b([a-z])(\w*)/g, (_m, a: string, rest: string) => a.toUpperCase() + rest);
}

const FILLERS = [
  /\byou know\b,?\s*/gi,
  /\bi mean\b,?\s*/gi,
  /\bsort of\b\s*/gi,
  /\bkind of\b\s*/gi,
  /\bbasically\b,?\s*/gi,
  /\bactually\b,?\s*/gi,
  /\bobviously\b,?\s*/gi,
  /\bhonestly\b,?\s*/gi,
  /\breally\b\s*/gi,
  /\bjust\b\s*/gi,
  /\bwell,\s*/gi,
  /\bso,\s*/gi,
  /\bright\?\s*/gi,
];

export function stripFillers(text: string): string {
  let out = text;
  for (const rx of FILLERS) out = out.replace(rx, "");
  out = out.replace(/\s{2,}/g, " ").trim();
  if (out.length > 0) out = out[0].toUpperCase() + out.slice(1);
  return out;
}

export interface ShortenResult {
  text: string;
  shortened: boolean;
  method: "none" | "fillers" | "clause" | "truncated";
}

/**
 * Genuinely shortens a line to a hard character cap, in three escalating steps,
 * and reports which step it had to use. The UI shows this, because a silent
 * truncation is exactly the kind of thing a human reviewer should be told about.
 */
export function shortenTo(text: string, cap: number): ShortenResult {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= cap) return { text: clean, shortened: false, method: "none" };

  const noFillers = stripFillers(clean);
  if (noFillers.length <= cap) return { text: noFillers, shortened: true, method: "fillers" };

  // Cut at the last clause boundary that still fits. The prefix is kept exactly
  // as the speaker said it, so shortening can never reorder or rejoin words.
  const boundary = /,\s|;\s|\s(?:which|because|while|although|so that|and then)\s/g;
  let cut = -1;
  let match: RegExpExecArray | null = boundary.exec(noFillers);
  while (match !== null) {
    if (match.index > cap - 1) break;
    cut = match.index;
    match = boundary.exec(noFillers);
  }
  const floor = Math.min(45, Math.floor(cap * 0.5));
  if (cut >= floor) {
    const head = noFillers.slice(0, cut).replace(/[,;:]$/, "").trim();
    const punctuated = /[.!?]$/.test(head) ? head : `${head}.`;
    if (punctuated.length <= cap) {
      return { text: punctuated, shortened: true, method: "clause" };
    }
  }

  const words = noFillers.split(" ");
  let out = "";
  for (const w of words) {
    if ((out ? `${out} ${w}` : w).length > cap - 3) break;
    out = out ? `${out} ${w}` : w;
  }
  out = out.replace(/[,;:]$/, "");
  return { text: `${out}...`, shortened: true, method: "truncated" };
}
