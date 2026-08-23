import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Hash,
  Layers,
  Scissors,
} from "lucide-react";
import type { AssetBundle, AssetId } from "../engine";
import type { BrandKit } from "../data/brand";
import { AssetCard } from "./AssetCard";
import { SlideCanvas } from "./SlideCanvas";
import { downloadSvg } from "../lib/brandStyle";
import type { Review, ReviewState } from "../lib/review";

interface Props {
  /** Incremented by the self playing demo to step the carousel forward. */
  advanceSlide?: number;
  bundle: AssetBundle | null;
  kit: BrandKit;
  running: boolean;
  stages: string[];
  stageIndex: number;
  streamChars: number;
  liveNotice: string | null;
  reviews: Record<AssetId, Review>;
  onReview: (id: AssetId, state: ReviewState) => void;
  onNote: (id: AssetId, note: string) => void;
}

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: over ? "hsl(var(--warn))" : "var(--b-primary)" }}
        />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function Preview({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-md border p-3 transition-colors duration-500"
      style={{
        backgroundColor: "var(--b-surface)",
        borderColor: "var(--b-primary-soft)",
        color: "var(--b-ink)",
        fontFamily: "var(--b-body)",
      }}
    >
      {children}
    </div>
  );
}

export function AssetsStage(props: Props) {
  const { bundle, kit } = props;
  const [slide, setSlide] = useState(0);

  const advance = props.advanceSlide ?? 0;
  useEffect(() => {
    if (advance === 0) return;
    setSlide((s) => (s + 1) % Math.max(1, props.bundle?.carousel.slides.length ?? 1));
  }, [advance, props.bundle]);
  const slideRefs = useRef<(SVGSVGElement | null)[]>([]);

  useEffect(() => {
    setSlide(0);
  }, [bundle?.sourceTitle, bundle?.generatedBy]);

  const quoteFor = (sentenceIndex: number): string | null => {
    if (!bundle || sentenceIndex < 0) return null;
    return bundle.parsed.sentences[sentenceIndex]?.text ?? null;
  };

  if (!bundle) {
    return (
      <div className="thin-scroll flex h-full min-h-0 flex-col overflow-y-auto pr-1">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-[15px] font-semibold">Six assets, one human gate</h2>
          <p className="mt-1.5 max-w-lg text-[12px] leading-relaxed text-muted-foreground">
            Pick a source on the left, choose the brand kit, then press Generate assets. The engine
            parses the source in this browser, ranks its sentences, scores every line for
            quotability and renders the result into the locked template. Everything lands here as
            Pending review, and nothing can leave without a human click.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-[12px] text-muted-foreground">
            {[
              "LinkedIn post",
              "Carousel, five slides",
              "Clip picks with timestamps",
              "Hook variants",
              "Newsletter blurb",
              "Insight report",
            ].map((label) => (
              <li key={label} className="rounded border border-border bg-surface-subtle px-2.5 py-2">
                {label}
              </li>
            ))}
          </ul>
        </div>

        {props.running && (
          <div className="mt-3 rounded-lg border border-border bg-card p-4">
            <PipelineList stages={props.stages} stageIndex={props.stageIndex} />
            {props.streamChars > 0 && (
              <p className="mt-3 font-mono text-[11px] text-accent">
                Claude is writing, {props.streamChars} characters received
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  const slides = bundle.carousel.slides;
  const current = slides[Math.min(slide, slides.length - 1)];

  const serialise = (index: number): string | null => {
    const node = slideRefs.current[index];
    if (!node) return null;
    return new XMLSerializer().serializeToString(node);
  };

  const downloadCurrent = () => {
    const markup = serialise(slide);
    if (markup) downloadSvg(markup, `${kit.id}-slide-${slide + 1}.svg`);
  };

  const downloadAll = () => {
    const parts: string[] = [];
    slides.forEach((_, i) => {
      const node = slideRefs.current[i];
      if (!node) return;
      parts.push(`<g transform="translate(${i * 1080},0)">${node.innerHTML}</g>`);
    });
    if (parts.length === 0) return;
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${
      parts.length * 1080
    } 1080" width="${parts.length * 1080}" height="1080">${parts.join("")}</svg>`;
    downloadSvg(markup, `${kit.id}-carousel.svg`);
  };

  return (
    <div className="thin-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      {/* Hidden copies, kept in the DOM so a download can serialise any slide. */}
      <div className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden>
        {slides.map((s, i) => (
          <SlideCanvas
            key={`hidden-${s.index}`}
            slide={s}
            kit={kit}
            total={slides.length}
            svgRef={(node) => {
              slideRefs.current[i] = node;
            }}
          />
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-subtle px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Detected topics
        </span>
        {bundle.terms.slice(0, 6).map((term) => (
          <span
            key={term.stem}
            title={`Weight ${term.score.toFixed(1)}, appears in ${term.df} sentences`}
            className="rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-500"
            style={{
              borderColor: "var(--b-primary)",
              color: "var(--b-primary)",
              backgroundColor: "var(--b-primary-soft)",
            }}
          >
            {term.label}
          </span>
        ))}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {bundle.generatedBy === "claude" ? "Claude API" : "Local engine"}
        </span>
      </div>

      {props.liveNotice && (
        <p className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-[11px] text-foreground">
          <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-warn" />
          {props.liveNotice}
        </p>
      )}

      {/* 1. Carousel. First because it is the asset that shows the locked template, and it must be on screen without scrolling. */}
      <AssetCard
        asset={bundle.carousel}
        index={0}
        review={props.reviews.carousel}
        onReview={(s) => props.onReview("carousel", s)}
        onNote={(n) => props.onNote("carousel", n)}
        quoteFor={quoteFor}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div
            key={`${kit.id}-${current.index}`}
            className="ae-fade-soft w-full max-w-[300px] shrink-0 overflow-hidden rounded-md border border-border"
          >
            <SlideCanvas slide={current} kit={kit} total={slides.length} className="block w-full" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:border-accent hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-[11px] text-foreground">
                  Slide {current.index + 1} of {slides.length}
                </span>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => setSlide((s) => (s + 1) % slides.length)}
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:border-accent hover:text-foreground"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                <span className="font-mono uppercase tracking-wide">{current.kind}</span> slide,{" "}
                {current.charCount} of {bundle.carousel.charCap} characters
                {current.shortened ? ", shortened by the engine to fit" : ""}.
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Rendered in the {kit.name} kit. The kit sets colour, type and wordmark. The grid,
                safe area and character cap do not move.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadCurrent}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-accent hover:text-foreground"
              >
                <Download className="h-3 w-3" /> Download slide SVG
              </button>
              <button
                type="button"
                onClick={downloadAll}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-accent hover:text-foreground"
              >
                <Layers className="h-3 w-3" /> All five
              </button>
            </div>
          </div>
        </div>
      </AssetCard>

      {/* 2. LinkedIn post */}
      <AssetCard
        asset={bundle.linkedin}
        index={1}
        review={props.reviews.linkedin}
        onReview={(s) => props.onReview("linkedin", s)}
        onNote={(n) => props.onNote("linkedin", n)}
        quoteFor={quoteFor}
      >
        <Preview>
          <p
            className="text-[13px] font-semibold leading-snug"
            style={{ fontFamily: "var(--b-head)", letterSpacing: "var(--b-head-tracking)" }}
          >
            {bundle.linkedin.hook}
          </p>
          <ol className="mt-2.5 space-y-1.5">
            {bundle.linkedin.points.map((point, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed">
                <span className="font-mono text-[11px]" style={{ color: "var(--b-primary)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2.5 text-[12px] font-medium" style={{ color: "var(--b-accent)" }}>
            {bundle.linkedin.question}
          </p>
        </Preview>
        <div className="mt-2 flex items-center justify-between">
          <Meter
            value={bundle.linkedin.charCount}
            max={bundle.linkedin.charLimit}
            label={`${bundle.linkedin.charCount} / ${bundle.linkedin.charLimit} characters`}
          />
          <span className="font-mono text-[10px] text-muted-foreground">
            {bundle.linkedin.points.length} points
          </span>
        </div>
      </AssetCard>

      {/* 3. Clip picks */}
      <AssetCard
        asset={bundle.clips}
        index={2}
        review={props.reviews.clips}
        onReview={(s) => props.onReview("clips", s)}
        onNote={(n) => props.onNote("clips", n)}
        quoteFor={quoteFor}
      >
        {!bundle.clips.available ? (
          <div className="flex items-start gap-2 rounded-md border border-warn/40 bg-warn/10 p-3">
            <Scissors className="mt-px h-3.5 w-3.5 shrink-0 text-warn" />
            <p className="text-[12px] leading-relaxed text-foreground">
              {bundle.clips.unavailableReason}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {bundle.clips.picks.map((pick) => (
              <li key={pick.rank} className="rounded-md border border-border bg-surface-subtle p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-500"
                    style={{ backgroundColor: "var(--b-primary)", color: "var(--b-surface)" }}
                  >
                    {pick.timecode}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {pick.durationSec}s
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    quotability {pick.score.toFixed(2)}
                  </span>
                  {pick.speaker && (
                    <span className="text-[10px] text-muted-foreground">{pick.speaker}</span>
                  )}
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed">{pick.quote}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {pick.features.map((f) => (
                    <span key={f.label} className="font-mono text-[9px] text-muted-foreground">
                      {f.label.toLowerCase()} {f.value.toFixed(2)}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AssetCard>

      {/* 4. Hook variants */}
      <AssetCard
        asset={bundle.hooks}
        index={3}
        review={props.reviews.hooks}
        onReview={(s) => props.onReview("hooks", s)}
        onNote={(n) => props.onNote("hooks", n)}
        quoteFor={quoteFor}
      >
        <ul className="space-y-1.5">
          {bundle.hooks.variants.map((variant, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-md border border-border bg-surface-subtle p-2"
            >
              <Hash className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "var(--b-primary)" }} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-snug">{variant.text}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {variant.style.toLowerCase()} , {variant.charCount} characters
                </p>
              </div>
            </li>
          ))}
        </ul>
      </AssetCard>

      {/* 5. Newsletter blurb */}
      <AssetCard
        asset={bundle.newsletter}
        index={4}
        review={props.reviews.newsletter}
        onReview={(s) => props.onReview("newsletter", s)}
        onNote={(n) => props.onNote("newsletter", n)}
        quoteFor={quoteFor}
      >
        <Preview>
          {bundle.newsletter.paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className={`text-[12px] leading-relaxed ${i > 0 ? "mt-2" : ""}`}
              style={i === 0 ? { fontFamily: "var(--b-head)" } : undefined}
            >
              {paragraph}
            </p>
          ))}
          <p
            className="mt-3 border-t pt-2 text-[11px] font-semibold"
            style={{ borderColor: "var(--b-primary-soft)", color: "var(--b-primary)" }}
          >
            {kit.cta}
          </p>
        </Preview>
        <div className="mt-2">
          <Meter
            value={bundle.newsletter.wordCount}
            max={bundle.newsletter.targetWords}
            label={`${bundle.newsletter.wordCount} words, target ${bundle.newsletter.targetWords}`}
          />
        </div>
      </AssetCard>

      {/* 6. Insight report */}
      <AssetCard
        asset={bundle.report}
        index={5}
        review={props.reviews.report}
        onReview={(s) => props.onReview("report", s)}
        onNote={(n) => props.onNote("report", n)}
        quoteFor={quoteFor}
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {bundle.report.headline}
        </p>
        <ul className="space-y-2">
          {bundle.report.themes.map((theme) => (
            <li key={theme.label} className="rounded-md border border-border bg-surface-subtle p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[12px] font-semibold transition-colors duration-500"
                  style={{ fontFamily: "var(--b-head)", color: "var(--b-primary)" }}
                >
                  {theme.label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {theme.supportCount} sentences
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed">{theme.evidence}</p>
              <p className="mt-1 font-mono text-[10px]" style={{ color: "var(--b-accent)" }}>
                {theme.timecode ? `[${theme.timecode}]` : `sentence ${theme.sentenceIndex + 1}`}
                {theme.speaker ? ` , ${theme.speaker}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </AssetCard>
    </div>
  );
}

export function PipelineList({ stages, stageIndex }: { stages: string[]; stageIndex: number }) {
  return (
    <ol className="space-y-1.5">
      {stages.map((stage, i) => {
        const done = i < stageIndex;
        const active = i === stageIndex;
        return (
          <li key={stage} className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                done ? "bg-ok" : active ? "bg-accent pulse-dot" : "bg-muted"
              }`}
            />
            <span
              className={`font-mono text-[11px] ${
                done ? "text-muted-foreground" : active ? "text-foreground" : "text-muted-foreground/50"
              }`}
            >
              {stage}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
