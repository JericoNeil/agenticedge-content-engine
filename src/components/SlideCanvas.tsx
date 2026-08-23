import type { Ref } from "react";
import type { CarouselSlide } from "../engine";
import { TEMPLATE_GEOMETRY, type BrandKit } from "../data/brand";

/**
 * The locked template, drawn as SVG.
 *
 * Every geometric value below comes from TEMPLATE_GEOMETRY and is the same for
 * every brand kit. The kit supplies colour, typeface, wordmark and call to
 * action. Nothing a kit provides can move an element.
 */

const { size, safe, columns, gutter, scale } = TEMPLATE_GEOMETRY;
const CONTENT = size - safe * 2;

interface FitResult {
  lines: string[];
  size: number;
}

function wrap(text: string, fontSize: number, factor: number): string[] {
  const perLine = Math.max(8, Math.floor(CONTENT / (fontSize * factor)));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > perLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Shrink the type one step at a time until the text fits the reserved block. */
function fit(text: string, start: number, minSize: number, maxLines: number, factor: number): FitResult {
  let fontSize = start;
  let lines = wrap(text, fontSize, factor);
  while (lines.length > maxLines && fontSize > minSize) {
    fontSize -= 6;
    lines = wrap(text, fontSize, factor);
  }
  return { lines, size: fontSize };
}

function Mark({ kit }: { kit: BrandKit }) {
  if (kit.mark === "wave") {
    return (
      <path
        d={`M${safe} 92 Q${safe + 9} 74 ${safe + 18} 92 T${safe + 36} 92`}
        fill="none"
        stroke={kit.primary}
        strokeWidth={6}
        strokeLinecap="round"
      />
    );
  }
  return (
    <path
      d={`M${safe} 96 L${safe + 18} 68 L${safe + 36} 96`}
      fill="none"
      stroke={kit.primary}
      strokeWidth={6}
      strokeLinejoin="round"
    />
  );
}

interface Props {
  slide: CarouselSlide;
  kit: BrandKit;
  total: number;
  svgRef?: Ref<SVGSVGElement>;
  className?: string;
}

export function SlideCanvas({ slide, kit, total, svgRef, className }: Props) {
  const gridStep = (CONTENT + gutter) / columns;
  const headlineFit =
    slide.kind === "cover"
      ? fit(slide.headline, scale.display, 44, 4, 0.56)
      : fit(slide.headline, scale.headline, 30, 3, 0.56);
  const bodyFit = fit(slide.body, scale.body, 20, 4, 0.52);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`Slide ${slide.index + 1} of ${total}, ${slide.headline}`}
    >
      <rect x={0} y={0} width={size} height={size} fill={kit.surface} />

      {/* The safe area and the 12 column grid, drawn faintly so the locked
          layout is visible on the artboard itself. */}
      <g opacity={0.07}>
        <rect
          x={safe}
          y={safe}
          width={CONTENT}
          height={CONTENT}
          fill="none"
          stroke={kit.ink}
          strokeWidth={2}
        />
        {Array.from({ length: columns - 1 }).map((_, i) => (
          <rect
            key={i}
            x={safe + (i + 1) * gridStep - gutter / 2}
            y={safe}
            width={1}
            height={CONTENT}
            fill={kit.ink}
          />
        ))}
      </g>

      <Mark kit={kit} />
      <text
        x={safe + 52}
        y={94}
        fill={kit.ink}
        fontFamily={kit.headingFont}
        fontWeight={kit.headingWeight}
        fontSize={26}
        letterSpacing="0.16em"
      >
        {kit.wordmark}
      </text>
      <text
        x={size - safe}
        y={94}
        textAnchor="end"
        fill={kit.inkMuted}
        fontFamily={kit.bodyFont}
        fontSize={22}
        letterSpacing="0.04em"
      >
        {kit.tagline}
      </text>

      <rect x={safe} y={132} width={size - safe * 2} height={2} fill={kit.ink} opacity={0.18} />

      <text
        x={safe}
        y={222}
        fill={kit.primary}
        fontFamily={kit.bodyFont}
        fontWeight={600}
        fontSize={scale.caption}
        letterSpacing="0.18em"
      >
        {slide.eyebrow.toUpperCase()}
      </text>

      {slide.kind === "cover" ? (
        <>
          <rect x={safe} y={272} width={132} height={8} fill={kit.primary} />
          <text
            x={safe}
            y={392}
            fill={kit.ink}
            fontFamily={kit.headingFont}
            fontWeight={kit.headingWeight}
            fontSize={headlineFit.size}
            letterSpacing={kit.headingTracking}
          >
            {headlineFit.lines.map((line, i) => (
              <tspan key={i} x={safe} dy={i === 0 ? 0 : headlineFit.size * 1.12}>
                {line}
              </tspan>
            ))}
          </text>
          <text
            x={safe}
            y={900}
            fill={kit.accent}
            fontFamily={kit.bodyFont}
            fontSize={scale.body}
            letterSpacing="0.04em"
          >
            {slide.body}
          </text>
          <rect x={safe} y={946} width={size - safe * 2} height={4} fill={kit.primary} opacity={0.5} />
        </>
      ) : slide.kind === "point" ? (
        <>
          <text
            x={safe}
            y={324}
            fill={kit.ink}
            fontFamily={kit.headingFont}
            fontWeight={kit.headingWeight}
            fontSize={headlineFit.size}
            letterSpacing={kit.headingTracking}
          >
            {headlineFit.lines.map((line, i) => (
              <tspan key={i} x={safe} dy={i === 0 ? 0 : headlineFit.size * 1.1}>
                {line}
              </tspan>
            ))}
          </text>
          <rect x={safe} y={404} width={96} height={6} fill={kit.primary} />
          <text
            x={safe}
            y={512}
            fill={kit.ink}
            fontFamily={kit.bodyFont}
            fontSize={bodyFit.size}
            opacity={0.92}
          >
            {bodyFit.lines.map((line, i) => (
              <tspan key={i} x={safe} dy={i === 0 ? 0 : bodyFit.size * 1.4}>
                {line}
              </tspan>
            ))}
          </text>
          {slide.citation && (
            <text
              x={safe}
              y={952}
              fill={kit.primary}
              fontFamily={kit.bodyFont}
              fontSize={scale.caption}
              letterSpacing="0.08em"
            >
              {`SOURCE ${slide.citation.label}`}
            </text>
          )}
        </>
      ) : (
        <>
          <text
            x={safe}
            y={420}
            fill={kit.ink}
            fontFamily={kit.headingFont}
            fontWeight={kit.headingWeight}
            fontSize={headlineFit.size}
            letterSpacing={kit.headingTracking}
          >
            {headlineFit.lines.map((line, i) => (
              <tspan key={i} x={safe} dy={i === 0 ? 0 : headlineFit.size * 1.12}>
                {line}
              </tspan>
            ))}
          </text>
          <rect x={safe} y={820} width={Math.min(CONTENT, kit.cta.length * 15 + 96)} height={84} rx={42} fill={kit.primary} />
          <text
            x={safe + 48}
            y={872}
            fill={kit.surface}
            fontFamily={kit.bodyFont}
            fontWeight={600}
            fontSize={scale.body}
          >
            {kit.cta}
          </text>
        </>
      )}

      <text
        x={size - safe}
        y={952}
        textAnchor="end"
        fill={kit.inkMuted}
        fontFamily={kit.bodyFont}
        fontSize={scale.caption}
        letterSpacing="0.12em"
      >
        {`${String(slide.index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
      </text>
    </svg>
  );
}
