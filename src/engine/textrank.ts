/**
 * TextRank style sentence centrality.
 *
 * Build an undirected similarity graph over the sentences using cosine
 * similarity of their TF-IDF vectors, then run power iteration until the score
 * vector stops moving. Sentences that many other sentences resemble end up with
 * the highest score, which is a reasonable proxy for "this is a key point in
 * this source". Selection then applies a redundancy penalty so the key points
 * are not five phrasings of one idea.
 */

import { cosine } from "./tfidf";

export interface RankOptions {
  damping: number;
  similarityFloor: number;
  maxIterations: number;
  tolerance: number;
}

export const DEFAULT_RANK_OPTIONS: RankOptions = {
  damping: 0.85,
  similarityFloor: 0.055,
  maxIterations: 120,
  tolerance: 1e-7,
};

export interface RankResult {
  scores: number[];
  normalised: number[];
  iterations: number;
  edges: number;
  converged: boolean;
}

export function textRank(
  vectors: Map<string, number>[],
  options: Partial<RankOptions> = {},
): RankResult {
  const opt = { ...DEFAULT_RANK_OPTIONS, ...options };
  const n = vectors.length;
  if (n === 0) return { scores: [], normalised: [], iterations: 0, edges: 0, converged: true };
  if (n === 1) return { scores: [1], normalised: [1], iterations: 0, edges: 0, converged: true };

  // Adjacency, stored as neighbour lists to keep it sparse.
  const neighbours: { j: number; w: number }[][] = Array.from({ length: n }, () => []);
  const outWeight = new Array<number>(n).fill(0);
  let edges = 0;

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const sim = cosine(vectors[i], vectors[j]);
      if (sim < opt.similarityFloor) continue;
      neighbours[i].push({ j, w: sim });
      neighbours[j].push({ j: i, w: sim });
      outWeight[i] += sim;
      outWeight[j] += sim;
      edges += 1;
    }
  }

  let scores = new Array<number>(n).fill(1 / n);
  let iterations = 0;
  let converged = false;

  for (let iter = 0; iter < opt.maxIterations; iter += 1) {
    const next = new Array<number>(n).fill((1 - opt.damping) / n);
    let dangling = 0;
    for (let i = 0; i < n; i += 1) if (outWeight[i] === 0) dangling += scores[i];

    for (let i = 0; i < n; i += 1) {
      if (outWeight[i] === 0) continue;
      const share = (opt.damping * scores[i]) / outWeight[i];
      for (const edge of neighbours[i]) next[edge.j] += share * edge.w;
    }
    // Isolated sentences hand their mass back to everybody, which keeps the
    // total mass at one and keeps the iteration stable.
    if (dangling > 0) {
      const spread = (opt.damping * dangling) / n;
      for (let i = 0; i < n; i += 1) next[i] += spread;
    }

    let delta = 0;
    for (let i = 0; i < n; i += 1) delta += Math.abs(next[i] - scores[i]);
    scores = next;
    iterations = iter + 1;
    if (delta < opt.tolerance) {
      converged = true;
      break;
    }
  }

  const max = Math.max(...scores);
  const normalised = scores.map((s) => (max > 0 ? s / max : 0));
  return { scores, normalised, iterations, edges, converged };
}

export interface SelectionOptions {
  count: number;
  minWords: number;
  maxWords: number;
  redundancyLimit: number;
}

/**
 * Greedy maximal marginal relevance selection over the ranked sentences, so the
 * chosen key points are both central and different from each other.
 */
export function selectDiverse(
  vectors: Map<string, number>[],
  scores: number[],
  wordCounts: number[],
  options: SelectionOptions,
): number[] {
  const order = scores
    .map((s, i) => ({ i, s }))
    .filter(({ i }) => wordCounts[i] >= options.minWords && wordCounts[i] <= options.maxWords)
    .sort((a, b) => b.s - a.s || a.i - b.i);

  const chosen: number[] = [];
  for (const candidate of order) {
    if (chosen.length >= options.count) break;
    const redundant = chosen.some(
      (c) => cosine(vectors[candidate.i], vectors[c]) > options.redundancyLimit,
    );
    if (redundant) continue;
    chosen.push(candidate.i);
  }

  // If the redundancy filter was too strict, top up in plain rank order.
  if (chosen.length < options.count) {
    for (const candidate of order) {
      if (chosen.length >= options.count) break;
      if (!chosen.includes(candidate.i)) chosen.push(candidate.i);
    }
  }

  return chosen;
}
