import { FileText, Mic, PenLine, ShieldCheck, Sparkles } from "lucide-react";
import { formatTimecode, type ParsedSource } from "../engine";
import { DEMO_SOURCES, PASTE_PLACEHOLDER } from "../data/sources";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  pasted: string;
  onPasteChange: (value: string) => void;
  parsed: ParsedSource | null;
  running: boolean;
  onGenerate: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-[12px] text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function SourceStage(props: Props) {
  const { selectedId, parsed } = props;
  const ready = parsed !== null && parsed.sentences.length > 2;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {DEMO_SOURCES.map((source, i) => {
          const active = selectedId === source.id;
          return (
            <button
              key={source.id}
              type="button"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => props.onSelect(source.id)}
              className={`ae-rise w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card hover:border-muted-foreground/40"
              }`}
            >
              <div className="flex items-center gap-2">
                {source.id === "article" ? (
                  <FileText className="h-3 w-3 text-accent" />
                ) : (
                  <Mic className="h-3 w-3 text-accent" />
                )}
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {source.kindLabel}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] font-medium leading-snug">{source.title}</p>
              {active && (
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  {source.description}
                </p>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => props.onSelect("paste")}
          className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
            selectedId === "paste"
              ? "border-accent bg-accent/10"
              : "border-border bg-card hover:border-muted-foreground/40"
          }`}
        >
          <div className="flex items-center gap-2">
            <PenLine className="h-3 w-3 text-accent" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Your own text
            </span>
          </div>
          <p className="mt-1 text-[12.5px] font-medium leading-snug">Paste your own</p>
          {selectedId === "paste" && (
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Different text produces different topics, points and clips.
            </p>
          )}
        </button>

        {selectedId === "paste" && (
          <textarea
            value={props.pasted}
            onChange={(e) => props.onPasteChange(e.target.value)}
            placeholder={PASTE_PLACEHOLDER}
            className="h-40 w-full resize-none rounded-lg border border-border bg-surface-subtle p-3 font-mono text-[11px] leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-accent"
          />
        )}

        {parsed && (
          <div className="rounded-lg border border-border bg-surface-subtle px-3 py-2">
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Parsed by the local engine
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
              <Stat label="words" value={parsed.wordCount.toLocaleString("en-GB")} />
              <Stat label="segments" value={String(parsed.segments.length)} />
              <Stat label="sentences" value={String(parsed.sentences.length)} />
              <Stat
                label="speaker turns"
                value={parsed.speakerTurns > 0 ? String(parsed.speakerTurns) : "0"}
              />
              <Stat
                label={parsed.durationSec !== null ? "from last timestamp" : "no timestamps"}
                value={parsed.durationSec !== null ? `${formatTimecode(parsed.durationSec)}` : "n/a"}
              />
            </div>
            {!parsed.hasTimestamps && (
              <p className="mt-2 rounded border border-warn/40 bg-warn/10 px-2 py-1.5 text-[10.5px] leading-snug text-foreground">
                No timestamps found, so clip picks will be reported as unavailable rather than
                invented.
              </p>
            )}
          </div>
        )}

        <p className="flex items-start gap-1.5 pt-1 text-[11px] leading-snug text-muted-foreground">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-ok" />
          Parsing runs in this browser. The source is never uploaded and no account is needed.
        </p>
      </div>

      <button
        type="button"
        disabled={!ready || props.running}
        onClick={props.onGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Sparkles className="h-4 w-4" />
        {props.running ? "Generating" : "Generate assets"}
      </button>
    </div>
  );
}
