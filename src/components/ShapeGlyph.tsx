import type { ReactElement } from 'react'

/**
 * ShapeGlyph — hand-drawn soft SVG shapes for the Shapes category. Every
 * glyph renders in the SAME color so shape is the only discriminator (never
 * color), with the storybook look: rounded joins, cream outline, soft fill.
 */

interface ShapeGlyphProps {
  shapeId: string
  size?: number
  fill?: string
}

/** viewBox is 0 0 100 100 for every path. */
const PATHS: Record<string, ReactElement> = {
  circle: <circle cx="50" cy="50" r="38" />,
  square: <rect x="14" y="14" width="72" height="72" rx="10" />,
  rectangle: <rect x="8" y="26" width="84" height="48" rx="10" />,
  triangle: (
    <path d="M50 12 L90 82 Q92 88 84 88 L16 88 Q8 88 10 82 Z" />
  ),
  star: (
    <path d="M50 8 L61 36 L91 38 L68 58 L76 88 L50 71 L24 88 L32 58 L9 38 L39 36 Z" />
  ),
  heart: (
    <path d="M50 88 C20 64 8 46 14 30 C19 17 36 14 50 30 C64 14 81 17 86 30 C92 46 80 64 50 88 Z" />
  ),
  pentagon: (
    <path d="M50 10 L88 38 L74 84 L26 84 L12 38 Z" />
  ),
  hexagon: (
    <path d="M30 15 L70 15 L90 50 L70 85 L30 85 L10 50 Z" />
  ),
}

export default function ShapeGlyph({
  shapeId,
  size = 72,
  fill = 'var(--grape)',
}: ShapeGlyphProps) {
  const path = PATHS[shapeId] ?? PATHS.circle
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{
        fill,
        stroke: 'var(--cream)',
        strokeWidth: 6,
        strokeLinejoin: 'round',
      }}
    >
      {path}
    </svg>
  )
}
