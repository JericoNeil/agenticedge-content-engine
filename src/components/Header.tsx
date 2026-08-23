import { Settings } from "lucide-react";

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="border-b border-border bg-surface-subtle">
      <div className="mx-auto flex h-14 w-full max-w-page items-center gap-3 px-6">
        <span className="text-[15px] font-semibold tracking-tight">Agentic Edge</span>
        <span className="h-5 w-px bg-border" aria-hidden />
        <span className="text-[15px] text-muted-foreground">Marketing Content Engine</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden rounded-full border border-border bg-muted px-3 py-1 font-mono text-[11px] text-muted-foreground sm:inline">
            Automation H - Standard EUR 399/mo
          </span>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
