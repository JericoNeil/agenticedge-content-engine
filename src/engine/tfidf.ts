/**
 * TF-IDF over the sentences of a single source.
 *
 * Each sentence is a document. Document frequencies are computed across the
 * source's own sentences, so a term that this speaker keeps coming back to
 * scores high and a term that appears everywhere in English scores low. There
 * is no external corpus and no pre-trained model anywhere in this file.
 */

import type { Sentence, Term } from "./types";
import { tokenize, stem, STOPWORDS } from "./text";

export interface TfidfModel {
  /** L2 normalised sparse vectors, one per sentence, keyed by stem. */
  vectors: Map<string, number>[];
  idf: Map<string, number>;
  df: Map<string, number>;
  terms: Term[];
  vocabularySize: number;
}

function surfaceForms(sentences: Sentence[]): Map<string, Map<string, number>> {
  const forms = new Map<string, Map<string, number>>();
  for (const s of sentences) {
    for (const raw of tokenize(s.text)) {
      if (raw.length <= 2 || STOPWORDS.has(raw) || /^\d+$/.test(raw)) continue;
      const st = stem(raw);
      if (st.length <= 2) continue;
      let bucket = forms.get(st);
      if (!bucket) {
        bucket = new Map();
        forms.set(st, bucket);
      }
      bucket.set(raw, (bucket.get(raw) ?? 0) + 1);
    }
  }
  return forms;
}

export function buildTfidf(sentences: Sentence[]): TfidfModel {
  const n = Math.max(1, sentences.length);
  const df = new Map<string, number>();
  const totalCount = new Map<string, number>();

  const counts: Map<string, number>[] = sentences.map((s) => {
    const c = new Map<string, number>();
    for (const t of s.terms) {
      c.set(t, (c.get(t) ?? 0) + 1);
      totalCount.set(t, (totalCount.get(t) ?? 0) + 1);
    }
    for (const t of c.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return c;
  });

  const idf = new Map<string, number>();
  for (const [t, d] of df) idf.set(t, Math.log(1 + n / (1 + d)));

  const vectors = counts.map((c) => {
    const v = new Map<string, number>();
    let norm = 0;
    for (const [t, count] of c) {
      const w = (1 + Math.log(count)) * (idf.get(t) ?? 0);
      if (w <= 0) continue;
      v.set(t, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) for (const [t, w] of v) v.set(t, w / norm);
    return v;
  });

  const forms = surfaceForms(sentences);
  const scored: Term[] = [];
  for (const [t, count] of totalCount) {
    const d = df.get(t) ?? 1;
    const termIdf = idf.get(t) ?? 0;
    // Weight of a topic: how often it is used, damped, times how distinctive it
    // is inside this source. Terms that appear in a single sentence are damped
    // further so a one off word cannot become the headline topic.
    const spread = d >= 2 ? 1 : 0.45;
    const score = (1 + Math.log(count)) * termIdf * spread * Math.sqrt(d);
    const bucket = forms.get(t);
    let label = t;
    if (bucket) {
      // Shortest surface form first, which is normally the base word, with
      // frequency as the tie break. "start" reads better than "started".
      label = [...bucket.entries()].sort(
        (a, b) => a[0].length - b[0].length || b[1] - a[1] || a[0].localeCompare(b[0]),
      )[0][0];
    }
    scored.push({ stem: t, label, score, df: d, count, idf: termIdf });
  }

  scored.sort((a, b) => b.score - a.score || a.stem.localeCompare(b.stem));

  return { vectors, idf, df, terms: scored, vocabularySize: totalCount.size };
}

/**
 * Second pass over the term list once sentence centrality is known. A term that
 * keeps turning up in the sentences the graph considers central is a topic. A
 * term of the same frequency scattered across throwaway lines is not.
 */
export function weightTermsByCentrality(
  terms: Term[],
  sentences: Sentence[],
  centrality: number[],
): Term[] {
  const totals = new Map<string, { sum: number; n: number }>();
  for (const s of sentences) {
    const c = centrality[s.index] ?? 0;
    for (const t of new Set(s.terms)) {
      const current = totals.get(t) ?? { sum: 0, n: 0 };
      current.sum += c;
      current.n += 1;
      totals.set(t, current);
    }
  }
  return terms
    .map((t) => {
      const agg = totals.get(t.stem);
      const mean = agg && agg.n > 0 ? agg.sum / agg.n : 0;
      return { ...t, score: t.score * (0.5 + 0.5 * mean) };
    })
    .sort((a, b) => b.score - a.score || a.stem.localeCompare(b.stem));
}

export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  // Vectors are L2 normalised, so the dot product is the cosine.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, w] of small) {
    const other = large.get(t);
    if (other !== undefined) dot += w * other;
  }
  return dot;
}
