import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { parseSource, runLocalEngine, stageLabels, type AssetBundle, type AssetId } from "./engine";
import { BRAND_KITS } from "./data/brand";
import { DEMO_SOURCES } from "./data/sources";
import { Header } from "./components/Header";
import { SettingsDrawer, type EngineMode } from "./components/SettingsDrawer";
import { SourceStage } from "./components/SourceStage";
import { BrandStage } from "./components/BrandStage";
import { AssetsStage } from "./components/AssetsStage";
import { ApprovalBar } from "./components/ApprovalBar";
import { brandVars } from "./lib/brandStyle";
import { ASSET_ORDER, emptyReviews, type Review, type ReviewState } from "./lib/review";
import { KEY_STORAGE, generateWithClaude } from "./lib/live";
import { DEMO_TOTAL_MS, isDemoMode, step } from "./lib/demo";
import { DemoBadge } from "./components/DemoBadge";

const COLUMNS = "lg:grid-cols-[288px_240px_minmax(0,1fr)]";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function RailItem({
  step,
  label,
  hint,
  active,
  last,
}: {
  step: string;
  label: string;
  hint: string;
  active: boolean;
  last?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
          active ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground"
        }`}
      >
        {step}
      </span>
      <span className={`text-[12px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span className="hidden truncate text-[11px] text-muted-foreground/70 xl:inline">{hint}</span>
      {!last && <ChevronRight className="ml-auto hidden h-3.5 w-3.5 text-border lg:block" />}
    </div>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(DEMO_SOURCES[0].id);
  const [pasted, setPasted] = useState("");
  const [brandId, setBrandId] = useState(BRAND_KITS[0].id);
  const [bundle, setBundle] = useState<AssetBundle | null>(null);
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<string[]>([]);
  const [stageIndex, setStageIndex] = useState(-1);
  const [streamChars, setStreamChars] = useState(0);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<AssetId, Review>>(emptyReviews);
  const [queued, setQueued] = useState(false);
  const [advanceSlide, setAdvanceSlide] = useState(0);

  const demoActive = useMemo(() => isDemoMode(), []);
  const [demoDone, setDemoDone] = useState(false);
  const [demoElapsed, setDemoElapsed] = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<EngineMode>("local");
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY_STORAGE);
    if (stored) {
      setApiKey(stored);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (remember && apiKey.trim().length > 0) {
      window.localStorage.setItem(KEY_STORAGE, apiKey.trim());
    } else if (!remember) {
      window.localStorage.removeItem(KEY_STORAGE);
    }
  }, [remember, apiKey]);

  const kit = BRAND_KITS.find((b) => b.id === brandId) ?? BRAND_KITS[0];
  const demoSource = DEMO_SOURCES.find((s) => s.id === selectedId) ?? null;
  const sourceText = selectedId === "paste" ? pasted : (demoSource?.text ?? "");
  const sourceTitle = selectedId === "paste" ? "" : (demoSource?.title ?? "");

  const parsed = useMemo(
    () => (sourceText.trim().length > 60 ? parseSource(sourceText) : null),
    [sourceText],
  );

  const generate = async () => {
    if (!parsed || running) return;
    setRunning(true);
    setQueued(false);
    setLiveNotice(null);
    setStreamChars(0);
    setBundle(null);
    setReviews(emptyReviews());
    setStageIndex(-1);

    const local = runLocalEngine(sourceText, { sourceTitle });
    const labels = stageLabels(local.analysis);
    setStages(labels);

    for (let i = 0; i < labels.length; i += 1) {
      setStageIndex(i);
      await sleep(290);
    }

    let result = local.bundle;
    if (mode === "live" && apiKey.trim().length > 0) {
      try {
        result = await generateWithClaude({
          apiKey: apiKey.trim(),
          analysis: local.analysis,
          localBundle: local.bundle,
          brand: kit,
          onDelta: (_chunk, total) => setStreamChars(total),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        setLiveNotice(
          `Live mode did not complete (${message}). Showing the local engine result instead.`,
        );
      }
    }

    setBundle(result);
    setStageIndex(labels.length);
    setRunning(false);
  };

  const resetDemo = () => {
    setSelectedId(DEMO_SOURCES[0].id);
    setPasted("");
    setBrandId(BRAND_KITS[0].id);
    setBundle(null);
    setRunning(false);
    setStages([]);
    setStageIndex(-1);
    setStreamChars(0);
    setLiveNotice(null);
    setReviews(emptyReviews());
    setQueued(false);
    setSettingsOpen(false);
  };

  // Self playing demo. It calls the same handlers the buttons call, so nothing
  // here is a shortcut around the engine. See src/lib/demo.ts.
  useEffect(() => {
    if (!demoActive) return;
    let cancelled = false;
    const isCancelled = () => cancelled;

    const started = Date.now();
    const ticker = window.setInterval(() => setDemoElapsed(Date.now() - started), 100);

    (async () => {
      try {
        await step(700, isCancelled);
        await generate();
        await step(2200, isCancelled);
        setAdvanceSlide((n) => n + 1);
        await step(2400, isCancelled);
        setBrandId(BRAND_KITS[1].id);
        await step(3000, isCancelled);
        setReviews((prev) => ({ ...prev, carousel: { ...prev.carousel, state: "approved" } }));
        await step(1600, isCancelled);
        if (!cancelled) setDemoDone(true);
      } catch {
        // cancelled on unmount, nothing to clean up beyond the interval below
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(ticker);
    };
    // Deliberately runs once, on mount, in demo mode only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoActive]);

  const setReview = (id: AssetId, state: ReviewState) => {
    setReviews((prev) => ({ ...prev, [id]: { ...prev[id], state } }));
    setQueued(false);
  };

  const setNote = (id: AssetId, note: string) => {
    setReviews((prev) => ({ ...prev, [id]: { ...prev[id], note } }));
  };

  const allApproved =
    bundle !== null && ASSET_ORDER.every((id) => reviews[id].state === "approved");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div className="mx-auto flex w-full max-w-page flex-1 flex-col overflow-hidden px-6">
        <div className={`grid grid-cols-1 gap-4 py-2.5 ${COLUMNS}`}>
          <RailItem step="1" label="Source" hint="parsed here" active={bundle === null} />
          <RailItem step="2" label="Brand kit" hint="locked template" active={bundle !== null} />
          <RailItem
            step="3"
            label="Assets and approval"
            hint="human gate"
            active={bundle !== null}
            last
          />
        </div>

        <main
          className={`brand-scope grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto pb-3 lg:overflow-hidden ${COLUMNS}`}
          style={brandVars(kit)}
        >
          <section className="min-h-0 lg:h-full">
            <SourceStage
              selectedId={selectedId}
              onSelect={setSelectedId}
              pasted={pasted}
              onPasteChange={setPasted}
              parsed={parsed}
              running={running}
              onGenerate={generate}
            />
          </section>

          <section className="min-h-0 lg:h-full">
            <BrandStage activeId={brandId} onSelect={setBrandId} />
          </section>

          <section className="min-h-0 lg:h-full">
            <AssetsStage
              bundle={bundle}
              kit={kit}
              running={running}
              stages={stages}
              stageIndex={stageIndex}
              streamChars={streamChars}
              liveNotice={liveNotice}
              reviews={reviews}
              onReview={setReview}
              onNote={setNote}
              advanceSlide={advanceSlide}
            />
          </section>
        </main>
      </div>

      <ApprovalBar
        reviews={reviews}
        ready={bundle !== null}
        queued={queued && allApproved}
        onQueue={() => setQueued(true)}
      />

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex h-8 w-full max-w-page items-center justify-between px-6">
          <p className="text-[11px] text-muted-foreground">
            Prototype built for the Agentic Edge business plan (TFM, Esade). Demo data is fictional.
          </p>
          <a
            href="https://github.com/JericoNeil/agenticedge-content-engine"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-muted-foreground underline-offset-2 hover:text-accent hover:underline"
          >
            GitHub repo
          </a>
        </div>
      </footer>

      {demoActive && (
        <DemoBadge done={demoDone} elapsedMs={demoElapsed} totalMs={DEMO_TOTAL_MS} />
      )}

      <SettingsDrawer
        open={settingsOpen}
        mode={mode}
        apiKey={apiKey}
        remember={remember}
        onClose={() => setSettingsOpen(false)}
        onModeChange={setMode}
        onKeyChange={setApiKey}
        onRememberChange={setRemember}
        onClearKey={() => {
          setApiKey("");
          setRemember(false);
          window.localStorage.removeItem(KEY_STORAGE);
        }}
        onReset={resetDemo}
      />
    </div>
  );
}
