/**
 * Brand kits.
 *
 * A brand kit is colour, typography, wordmark and call to action. Nothing else.
 * The layout, the grid, the safe area and the character caps live in the locked
 * template below and are identical for every kit. That separation is the point
 * of this stage: the brand kit changes, the layout does not.
 */

export interface BrandKit {
  id: string;
  name: string;
  owner: string;
  wordmark: string;
  tagline: string;
  primary: string;
  primarySoft: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkMuted: string;
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  headingTracking: string;
  cta: string;
  mark: "chevron" | "wave";
}

export const BRAND_KITS: BrandKit[] = [
  {
    id: "agentic-edge",
    name: "Agentic Edge",
    owner: "Own brand",
    wordmark: "AGENTIC EDGE",
    tagline: "Leading in AI",
    primary: "#1e9fb2",
    primarySoft: "#154e58",
    accent: "#5fd8e6",
    surface: "#0a0d12",
    surfaceAlt: "#111720",
    ink: "#eef4f8",
    inkMuted: "#8798a6",
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    headingWeight: 700,
    headingTracking: "-0.02em",
    cta: "Full episode on Leading in AI",
    mark: "chevron",
  },
  {
    id: "costa-verde",
    name: "Costa Verde Tours",
    owner: "Client kit, fictional",
    wordmark: "COSTA VERDE",
    tagline: "Atlantic coast, slowly",
    primary: "#d2552e",
    primarySoft: "#f6ded1",
    accent: "#3d8f68",
    surface: "#f6f0e4",
    surfaceAlt: "#ece2d0",
    ink: "#1b3329",
    inkMuted: "#6f8378",
    headingFont: "Fraunces, Georgia, serif",
    bodyFont: "Inter, system-ui, sans-serif",
    headingWeight: 600,
    headingTracking: "0em",
    cta: "Routes and dates at costaverdetours.example",
    mark: "wave",
  },
];

export interface TemplateRule {
  label: string;
  value: string;
}

/** Read only in the interface. The same numbers drive the SVG renderer. */
export const LOCKED_TEMPLATE: TemplateRule[] = [
  { label: "Artboard", value: "1080 x 1080" },
  { label: "Logo position", value: "Top left, safe line" },
  { label: "Safe area", value: "72 px, all edges" },
  { label: "Grid", value: "12 col, 24 px gutter" },
  { label: "Type scale", value: "76 / 52 / 38 / 20" },
  { label: "Max chars per slide", value: "120" },
  { label: "Slides per carousel", value: "5, fixed order" },
];

export const TEMPLATE_GEOMETRY = {
  size: 1080,
  safe: 72,
  columns: 12,
  gutter: 24,
  scale: { display: 76, headline: 52, body: 38, caption: 20 },
  charCap: 120,
};
