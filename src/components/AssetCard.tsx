import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, MessageSquare, Quote, X } from "lucide-react";
import type { AssetBase } from "../engine";
import { CONFIDENCE_FLOOR, REVIEW_LABEL, type Review, type ReviewState } from "../lib/review";

interface Props {
  asset: AssetBase;
  index: number;
  review: Review;
  onReview: (state: ReviewState) => void;
  onNote: (note: string) => void;
  quoteFor: (sentenceIndex: number) => string | null;
  children: ReactNode;
}

const STATE_STYLE: Record<ReviewState, string> = {
  pending: "border-border bg-muted text-muted-foreground",
  approved: "border-ok/50 bg-ok/15 text-ok",
  changes: "border-warn/50 bg-warn/15 text-warn",
  rejected: "border-red-500/50 bg-red-500/10 text-red-400",
};

export function AssetCard(props: Props) {
  const { asset, review } = props;
  const [noteOpen, setNoteOpen] = useState(false);
  const lowConfidence = asset.confidence < CONFIDENCE_FLOOR;

  return (
    <article
      style={{ animationDelay: `${Math.min(props.index * 0.06, 0.4)}s` }}
      className="ae-rise shrink-0 overflow-hidden rounded-lg border border-border bg-card"
    >
      <header className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3
            className="text-[14px] font-semibold leading-tight"
            style={{ fontFamily: "var(--b-head)", letterSpacing: "var(--b-head-tracking)" }}
          >
            {asset.title}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{asset.subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${STATE_STYLE[review.state]}`}
          >
            {REVIEW_LABEL[review.state]}
          </span>
          <span
            className="font-mono text-[10px] text-muted-foreground"
            title={asset.confidenceNote}
          >
            Confidence {asset.confidence.toFixed(2)}
          </span>
        </div>
      </header>

      {lowConfidence && (
        <div className="flex items-start gap-2 border-b border-warn/30 bg-warn/10 px-4 py-2">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-warn" />
          <p className="text-[11px] leading-snug text-foreground">
            Low confidence. The engine will not suggest approval here, a person decides.{" "}
            <span className="text-muted-foreground">{asset.confidenceNote}</span>
          </p>
        </div>
      )}

      <div className="px-4 py-3">{props.children}</div>

      {asset.notes.length > 0 && (
        <ul className="space-y-1 border-t border-border bg-surface-subtle px-4 py-2">
          {asset.notes.map((note) => (
            <li key={note} className="text-[11px] leading-snug text-muted-foreground">
              Engine note: {note}
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t border-border bg-surface-subtle px-4 py-2.5">
        {asset.citations.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Quote className="h-3 w-3 text-accent" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Grounded in
            </span>
            {asset.citations.map((citation, i) => (
              <span
                key={`${citation.label}-${i}`}
                title={props.quoteFor(citation.sentenceIndex) ?? "From the selected source"}
                className="cursor-help rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent"
              >
                {citation.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              props.onReview("approved");
              setNoteOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              review.state === "approved"
                ? "border-ok bg-ok/20 text-ok"
                : "border-border text-muted-foreground hover:border-ok hover:text-ok"
            }`}
          >
            <Check className="h-3 w-3" /> Approve
          </button>
          <button
            type="button"
            onClick={() => {
              props.onReview("changes");
              setNoteOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              review.state === "changes"
                ? "border-warn bg-warn/20 text-warn"
                : "border-border text-muted-foreground hover:border-warn hover:text-warn"
            }`}
          >
            <MessageSquare className="h-3 w-3" /> Request change
          </button>
          <button
            type="button"
            onClick={() => {
              props.onReview("rejected");
              setNoteOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              review.state === "rejected"
                ? "border-red-500 bg-red-500/15 text-red-400"
                : "border-border text-muted-foreground hover:border-red-500 hover:text-red-400"
            }`}
          >
            <X className="h-3 w-3" /> Reject
          </button>
        </div>

        {(noteOpen || (review.state === "changes" && review.note.length > 0)) && (
          <div className="mt-2">
            <textarea
              value={review.note}
              onChange={(e) => props.onNote(e.target.value)}
              placeholder="What should change? This note stays with the asset in the queue."
              className="h-16 w-full resize-none rounded-md border border-warn/40 bg-background p-2 text-[11px] outline-none placeholder:text-muted-foreground/70 focus:border-warn"
            />
          </div>
        )}
      </footer>
    </article>
  );
}
