import type { AssetId } from "../engine";

export type ReviewState = "pending" | "approved" | "changes" | "rejected";

export interface Review {
  state: ReviewState;
  note: string;
}

export const ASSET_ORDER: AssetId[] = [
  "linkedin",
  "carousel",
  "clips",
  "hooks",
  "newsletter",
  "report",
];

export const REVIEW_LABEL: Record<ReviewState, string> = {
  pending: "Pending review",
  approved: "Approved",
  changes: "Changes requested",
  rejected: "Rejected",
};

export function emptyReviews(): Record<AssetId, Review> {
  return ASSET_ORDER.reduce(
    (acc, id) => {
      acc[id] = { state: "pending", note: "" };
      return acc;
    },
    {} as Record<AssetId, Review>,
  );
}

export function approvedCount(reviews: Record<AssetId, Review>): number {
  return ASSET_ORDER.filter((id) => reviews[id].state === "approved").length;
}

/** Below this the engine hands the decision to a person rather than suggesting approval. */
export const CONFIDENCE_FLOOR = 0.6;
