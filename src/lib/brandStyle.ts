import type { CSSProperties } from "react";
import type { BrandKit } from "../data/brand";

/**
 * The brand kit reaches the components as CSS custom properties on one wrapper.
 * Switching kit changes these values and nothing else, which is why the layout
 * cannot move when the kit changes.
 */
export function brandVars(kit: BrandKit): CSSProperties {
  return {
    "--b-primary": kit.primary,
    "--b-primary-soft": kit.primarySoft,
    "--b-accent": kit.accent,
    "--b-surface": kit.surface,
    "--b-surface-alt": kit.surfaceAlt,
    "--b-ink": kit.ink,
    "--b-ink-muted": kit.inkMuted,
    "--b-head": kit.headingFont,
    "--b-body": kit.bodyFont,
    "--b-head-weight": String(kit.headingWeight),
    "--b-head-tracking": kit.headingTracking,
  } as CSSProperties;
}

export function downloadSvg(markup: string, filename: string): void {
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
