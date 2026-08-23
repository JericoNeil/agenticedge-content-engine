import { RotateCcw, X } from "lucide-react";

export type EngineMode = "local" | "live";

interface Props {
  open: boolean;
  mode: EngineMode;
  apiKey: string;
  remember: boolean;
  onClose: () => void;
  onModeChange: (mode: EngineMode) => void;
  onKeyChange: (key: string) => void;
  onRememberChange: (remember: boolean) => void;
  onClearKey: () => void;
  onReset: () => void;
}

export function SettingsDrawer(props: Props) {
  // The drawer animates in and unmounts instantly on close. No exit animation,
  // deliberately: an exit animation on a full screen overlay can leave an
  // invisible click blocker behind if the animation loop is ever paused.
  if (!props.open) return null;

  return (
    <>
      <div
        className="ae-fade fixed inset-0 z-40 bg-black/60"
        onClick={props.onClose}
      />
      <aside
            className="ae-slide-in fixed right-0 top-0 z-50 flex h-full w-[400px] max-w-[92vw] flex-col overflow-y-auto border-l border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Settings</h2>
              <button
                type="button"
                onClick={props.onClose}
                aria-label="Close settings"
                className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Engine mode
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-subtle p-1">
                {(
                  [
                    ["local", "Local engine (default)"],
                    ["live", "Claude API (live)"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => props.onModeChange(value)}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      props.mode === value
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                The local engine needs no key and no network. It is the mode used for the recorded
                demo.
              </p>
            </section>

            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Anthropic API key
              </h3>
              <input
                type="password"
                value={props.apiKey}
                onChange={(e) => props.onKeyChange(e.target.value)}
                placeholder="sk-ant-..."
                className="mt-3 w-full rounded-md border border-border bg-surface-subtle px-3 py-2 font-mono text-xs outline-none focus:border-accent"
              />
              <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={props.remember}
                  onChange={(e) => props.onRememberChange(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[hsl(var(--accent))]"
                />
                Remember on this device
              </label>
              <button
                type="button"
                onClick={props.onClearKey}
                className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-warn hover:text-foreground"
              >
                Clear key
              </button>
              <p className="mt-3 rounded-md border border-warn/40 bg-warn/10 p-3 text-xs leading-relaxed text-foreground">
                Your key is sent directly from this browser to the Anthropic API and is never sent to
                any Agentic Edge server. In production this call sits behind a server side proxy. Use
                a key with a low spend limit.
              </p>
            </section>

            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Demo
              </h3>
              <button
                type="button"
                onClick={props.onReset}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:border-accent hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset demo
              </button>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Returns every stage to first load, for a clean re-take.
              </p>
            </section>
      </aside>
    </>
  );
}
