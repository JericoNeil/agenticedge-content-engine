import { CheckCircle2, Lock, Send } from "lucide-react";
import type { AssetId } from "../engine";
import { ASSET_ORDER, REVIEW_LABEL, type Review } from "../lib/review";

interface Props {
  reviews: Record<AssetId, Review>;
  ready: boolean;
  queued: boolean;
  onQueue: () => void;
}

const DOT: Record<string, string> = {
  pending: "bg-muted",
  approved: "bg-ok",
  changes: "bg-warn",
  rejected: "bg-red-500",
};

export function ApprovalBar({ reviews, ready, queued, onQueue }: Props) {
  const approved = ASSET_ORDER.filter((id) => reviews[id].state === "approved").length;
  const changes = ASSET_ORDER.filter((id) => reviews[id].state === "changes").length;
  const rejected = ASSET_ORDER.filter((id) => reviews[id].state === "rejected").length;
  const allApproved = approved === ASSET_ORDER.length;

  return (
    <div className="border-t border-border bg-surface-subtle">
      <div className="mx-auto flex h-14 w-full max-w-page items-center gap-4 px-6">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[13px] font-semibold">
            {approved} of {ASSET_ORDER.length} approved
          </span>
        </div>

        <div className="flex items-center gap-1">
          {ASSET_ORDER.map((id) => (
            <span
              key={id}
              title={`${id}: ${REVIEW_LABEL[reviews[id].state]}`}
              className={`h-2 w-2 rounded-full ${DOT[reviews[id].state]}`}
            />
          ))}
        </div>

        <span className="hidden text-[11px] text-muted-foreground md:inline">
          {changes > 0 && `${changes} with changes requested. `}
          {rejected > 0 && `${rejected} rejected. `}
          Nothing leaves this workspace without a human click.
        </span>

        <div className="ml-auto flex items-center gap-3">
          {queued && (
            <span className="flex items-center gap-1.5 text-[11px] text-ok">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Six assets queued. Nothing was published.
            </span>
          )}
          <button
            type="button"
            disabled={!ready || !allApproved}
            onClick={onQueue}
            className="inline-flex items-center gap-2 rounded-lg border border-accent bg-accent px-3.5 py-2 text-[12px] font-semibold text-accent-foreground transition-opacity disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-70"
          >
            <Send className="h-3.5 w-3.5" />
            Queue for publishing (prototype does not publish)
          </button>
        </div>
      </div>
    </div>
  );
}
