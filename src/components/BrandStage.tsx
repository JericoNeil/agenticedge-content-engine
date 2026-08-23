import { Lock } from "lucide-react";
import { BRAND_KITS, LOCKED_TEMPLATE, type BrandKit } from "../data/brand";

interface Props {
  activeId: string;
  onSelect: (id: string) => void;
}

function KitCard({
  kit,
  active,
  onSelect,
}: {
  kit: BrandKit;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full shrink-0 overflow-hidden rounded-lg border text-left transition-colors ${
        active
          ? "border-accent ring-1 ring-accent"
          : "border-border opacity-70 hover:border-muted-foreground/40 hover:opacity-100"
      }`}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 transition-colors duration-500"
        style={{ backgroundColor: kit.surface }}
      >
        <span
          className="text-[13px]"
          style={{
            color: kit.ink,
            fontFamily: kit.headingFont,
            fontWeight: kit.headingWeight,
            letterSpacing: kit.headingTracking,
          }}
        >
          {kit.wordmark}
        </span>
        <span className="flex gap-1">
          <span className="h-4 w-4 rounded-sm" style={{ backgroundColor: kit.primary }} />
          <span className="h-4 w-4 rounded-sm" style={{ backgroundColor: kit.accent }} />
        </span>
      </div>
      <div className="bg-card px-3 py-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[12px] font-medium">{kit.name}</p>
          {active ? (
            <span className="rounded-full border border-accent px-1.5 font-mono text-[9px] text-accent">
              in use
            </span>
          ) : (
            <p className="text-[10px] text-muted-foreground">{kit.owner}</p>
          )}
        </div>
        <p className="font-mono text-[9.5px] text-muted-foreground">
          {kit.headingFont.split(",")[0]} / {kit.bodyFont.split(",")[0]}
        </p>
      </div>
    </button>
  );
}

export function BrandStage({ activeId, onSelect }: Props) {
  return (
    <div className="thin-scroll flex h-full min-h-0 flex-col gap-2 overflow-y-auto pr-1">
      {BRAND_KITS.map((kit) => (
        <KitCard
          key={kit.id}
          kit={kit}
          active={kit.id === activeId}
          onSelect={() => onSelect(kit.id)}
        />
      ))}

      <div className="shrink-0 rounded-lg border border-border bg-surface-subtle px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Locked template, read only
          </p>
        </div>
        <dl className="mt-1.5 space-y-0.5">
          {LOCKED_TEMPLATE.map((rule) => (
            <div key={rule.label} className="flex items-baseline justify-between gap-2">
              <dt className="text-[10px] text-muted-foreground">{rule.label}</dt>
              <dd className="font-mono text-[10px] text-foreground/85">{rule.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 border-t border-border pt-1.5 text-[10.5px] leading-snug text-foreground">
          The brand kit changes. The layout does not.
        </p>
      </div>
    </div>
  );
}
