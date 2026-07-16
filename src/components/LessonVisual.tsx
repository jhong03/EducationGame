import type { LessonVisual as Visual } from '../content/lessons'
import ShapeGlyph from './ShapeGlyph'

/**
 * LessonVisual — renders the small illustration for a lesson step. Each kind is
 * a simple, theme-aware SVG/DOM figure that shows the idea (a divided bar, a dot
 * array, base-ten blocks, a hundred-grid, a number line, coins, a clock, an
 * angle). Purely decorative for assistive tech — the step text carries meaning.
 */
export default function LessonVisual({ v }: { v: Visual }) {
  return (
    <div className="grid place-items-center" aria-hidden="true">
      {render(v)}
    </div>
  )
}

function render(v: Visual) {
  switch (v.kind) {
    case 'fraction':
      return <Fraction parts={v.parts} shaded={v.shaded} />
    case 'array':
      return <DotArray rows={v.rows} cols={v.cols} />
    case 'place-value':
      return <PlaceValue hundreds={v.hundreds ?? 0} tens={v.tens} ones={v.ones} />
    case 'percent':
      return <PercentGrid shaded={v.shaded} />
    case 'number-line':
      return <NumberLine min={v.min} max={v.max} mark={v.mark} />
    case 'coins':
      return <Coins values={v.values} />
    case 'clock':
      return <Clock hour={v.hour} minute={v.minute} />
    case 'angle':
      return <Angle degrees={v.degrees} />
    case 'emoji-row':
      return <EmojiRow emoji={v.emoji} count={v.count} />
    case 'emoji-groups':
      return <EmojiGroups left={v.left} right={v.right} op={v.op} />
    case 'shape':
      return (
        <div className="grid place-items-center p-2">
          <ShapeGlyph shapeId={v.shapeId} size={110} fill="var(--grape)" />
        </div>
      )
    case 'pattern':
      return <PatternRow motifs={v.motifs} />
    case 'bar-graph':
      return <BarGraph bars={v.bars} />
    case 'expr':
      return <Expr text={v.text} />
    case 'grid-star':
      return <GridStar x={v.x} y={v.y} size={v.size} />
    case 'sizes':
      return <Sizes big={v.big} small={v.small} />
  }
}

function EmojiRow({ emoji, count }: { emoji: string; count: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ fontSize: 'clamp(30px, 8vw, 42px)', lineHeight: 1 }}>
          {emoji}
        </span>
      ))}
    </div>
  )
}

function EmojiGroups({
  left,
  right,
  op,
}: {
  left: { emoji: string; count: number }
  right: { emoji: string; count: number }
  op: '+' | '−' | 'vs' | ':'
}) {
  const cluster = (g: { emoji: string; count: number }, fade: boolean) => (
    <span
      className="flex max-w-[130px] flex-wrap items-center justify-center gap-1 rounded-2xl px-2 py-2"
      style={{ background: 'var(--tint)', opacity: fade ? 0.45 : 1 }}
    >
      {Array.from({ length: g.count }, (_, i) => (
        <span key={i} style={{ fontSize: 'clamp(22px, 6vw, 32px)', lineHeight: 1 }}>
          {g.emoji}
        </span>
      ))}
    </span>
  )
  return (
    <div className="flex items-center justify-center gap-3">
      {cluster(left, false)}
      <span
        className="font-bold"
        style={{ fontSize: op === 'vs' ? 16 : 30, color: 'var(--coral)' }}
      >
        {op}
      </span>
      {/* in a take-away, the right group is the part that leaves */}
      {cluster(right, op === '−')}
    </div>
  )
}

function PatternRow({ motifs }: { motifs: string[] }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 rounded-2xl px-3 py-2"
      style={{ background: 'var(--tint)' }}
    >
      {motifs.map((m, i) => (
        <span key={i} style={{ fontSize: 'clamp(26px, 7vw, 38px)', lineHeight: 1 }}>
          {m}
        </span>
      ))}
    </div>
  )
}

function BarGraph({ bars }: { bars: { emoji: string; value: number }[] }) {
  return (
    <div className="flex items-end justify-center gap-4">
      {bars.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div className="flex flex-col-reverse gap-0.5">
            {Array.from({ length: b.value }, (_, j) => (
              <span
                key={j}
                style={{
                  width: 'clamp(26px, 7vw, 34px)',
                  height: 16,
                  borderRadius: 4,
                  background: 'var(--grape)',
                  boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.14)',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 22 }}>{b.emoji}</span>
        </div>
      ))}
    </div>
  )
}

function Expr({ text }: { text: string }) {
  return (
    <p
      className="max-w-full text-center font-bold text-ink"
      style={{ fontSize: 'clamp(22px, 6vw, 30px)', lineHeight: 1.35 }}
    >
      {text}
    </p>
  )
}

function GridStar({ x, y, size }: { x: number; y: number; size: number }) {
  const CELL = 34
  const PAD = 26
  const W = PAD + size * CELL + 10
  const H = size * CELL + PAD + 10
  const gx = (v: number) => PAD + v * CELL
  const gy = (v: number) => 10 + (size - v) * CELL
  return (
    <svg
      width={`min(80vw, ${W}px)`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`a star at ${x} across, ${y} up`}
    >
      {Array.from({ length: size + 1 }, (_, i) => (
        <g key={i}>
          <line
            x1={gx(0)}
            y1={gy(i)}
            x2={gx(size)}
            y2={gy(i)}
            stroke={i === 0 ? 'var(--ink)' : 'var(--line-strong)'}
            strokeWidth={i === 0 ? 2.5 : 1}
          />
          <line
            x1={gx(i)}
            y1={gy(0)}
            x2={gx(i)}
            y2={gy(size)}
            stroke={i === 0 ? 'var(--ink)' : 'var(--line-strong)'}
            strokeWidth={i === 0 ? 2.5 : 1}
          />
          <text x={gx(i)} y={gy(0) + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-soft)">
            {i}
          </text>
          {i > 0 && (
            <text x={gx(0) - 10} y={gy(i) + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-soft)">
              {i}
            </text>
          )}
        </g>
      ))}
      <text x={gx(x)} y={gy(y) + 7} textAnchor="middle" fontSize="22">
        ⭐
      </text>
    </svg>
  )
}

function Sizes({ big, small }: { big: string; small: string }) {
  return (
    <div className="flex items-end justify-center gap-6">
      <span style={{ fontSize: 'clamp(56px, 15vw, 76px)', lineHeight: 1 }}>{big}</span>
      <span style={{ fontSize: 'clamp(24px, 7vw, 32px)', lineHeight: 1 }}>{small}</span>
    </div>
  )
}

function Fraction({ parts, shaded }: { parts: number; shaded: number }) {
  return (
    <div
      className="flex overflow-hidden rounded-2xl"
      style={{ width: 'min(78vw, 300px)', height: 66, border: '2.5px solid var(--ink)' }}
    >
      {Array.from({ length: parts }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i < shaded ? 'var(--leaf)' : 'var(--cream)',
            borderRight: i < parts - 1 ? '2px solid var(--ink)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

function DotArray({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <span
          key={i}
          style={{
            width: 'clamp(20px, 6vw, 30px)',
            height: 'clamp(20px, 6vw, 30px)',
            borderRadius: 999,
            background: 'var(--grape)',
            boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.15)',
          }}
        />
      ))}
    </div>
  )
}

function PlaceValue({
  hundreds,
  tens,
  ones,
}: {
  hundreds: number
  tens: number
  ones: number
}) {
  const grid = (color: string, size: number) => ({
    background: color,
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent 0 9px, rgba(46,35,64,0.28) 9px 10px), repeating-linear-gradient(90deg, transparent 0 9px, rgba(46,35,64,0.28) 9px 10px)',
    borderRadius: 4,
    border: '1.5px solid var(--ink)',
    width: size,
    height: size,
  })
  return (
    <div className="flex items-end gap-4">
      {hundreds > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5">
            {Array.from({ length: hundreds }, (_, i) => (
              <div key={i} style={grid('var(--leaf)', 100)} />
            ))}
          </div>
          <span className="u-eyebrow" style={{ fontSize: 10 }}>
            hundreds
          </span>
        </div>
      )}
      {tens > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5">
            {Array.from({ length: tens }, (_, i) => (
              <div
                key={i}
                style={{
                  ...grid('var(--grape)', 100),
                  width: 16,
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent 0 9px, rgba(255,255,255,0.35) 9px 10px)',
                }}
              />
            ))}
          </div>
          <span className="u-eyebrow" style={{ fontSize: 10 }}>
            tens
          </span>
        </div>
      )}
      {ones > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <div className="grid max-w-[60px] grid-cols-3 gap-1.5">
            {Array.from({ length: ones }, (_, i) => (
              <div
                key={i}
                style={{ width: 16, height: 16, background: 'var(--sun)', borderRadius: 3, border: '1.5px solid var(--ink)' }}
              />
            ))}
          </div>
          <span className="u-eyebrow" style={{ fontSize: 10 }}>
            ones
          </span>
        </div>
      )}
    </div>
  )
}

function PercentGrid({ shaded }: { shaded: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: 2,
        width: 'min(66vw, 230px)',
      }}
    >
      {Array.from({ length: 100 }, (_, i) => (
        <span
          key={i}
          style={{
            aspectRatio: '1',
            borderRadius: 2,
            background: i < shaded ? 'var(--grape)' : 'var(--cream)',
            border: '1px solid var(--line-strong)',
          }}
        />
      ))}
    </div>
  )
}

function NumberLine({ min, max, mark }: { min: number; max: number; mark: number }) {
  const W = 320
  const H = 88
  const pad = 22
  const span = max - min
  const x = (v: number) => pad + ((v - min) / span) * (W - pad * 2)
  const y = 40
  const ticks = Array.from({ length: span + 1 }, (_, i) => min + i)
  return (
    <svg
      width="min(86vw, 320px)"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`number line marked at ${mark}`}
    >
      <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={x(v)}
            y1={y - (v === 0 ? 12 : 8)}
            x2={x(v)}
            y2={y + (v === 0 ? 12 : 8)}
            stroke={v === 0 ? 'var(--grape)' : 'var(--ink)'}
            strokeWidth={v === 0 ? 3 : 2}
          />
          <text
            x={x(v)}
            y={y + 28}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill={v < 0 ? 'var(--coral)' : 'var(--ink)'}
          >
            {v}
          </text>
        </g>
      ))}
      <circle cx={x(mark)} cy={y} r="8" fill="var(--coral)" stroke="var(--cream)" strokeWidth="2.5" />
    </svg>
  )
}

function Coins({ values }: { values: number[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {values.map((v, i) => (
        <span
          key={i}
          className="grid place-items-center rounded-full font-bold text-ink"
          style={{
            width: 'clamp(46px, 13vw, 60px)',
            height: 'clamp(46px, 13vw, 60px)',
            background: 'var(--sun-grad)',
            border: '3px solid color-mix(in srgb, var(--sun) 55%, var(--cream))',
            boxShadow: '0 3px 8px rgba(197,137,31,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
            fontSize: 'clamp(18px, 5vw, 24px)',
          }}
        >
          {v}
        </span>
      ))}
    </div>
  )
}

function Clock({ hour, minute }: { hour: number; minute: number }) {
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const minuteAngle = minute * 6
  return (
    <svg
      width="min(52vw, 180px)"
      height="min(52vw, 180px)"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`clock at ${hour}:${minute === 0 ? '00' : minute}`}
    >
      <circle cx="50" cy="50" r="46" fill="var(--cream)" stroke="var(--grape)" strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180
        const isQuarter = i % 3 === 0
        const r1 = isQuarter ? 36 : 39
        return (
          <line
            key={i}
            x1={50 + r1 * Math.sin(a)}
            y1={50 - r1 * Math.cos(a)}
            x2={50 + 42 * Math.sin(a)}
            y2={50 - 42 * Math.cos(a)}
            stroke="var(--ink)"
            strokeWidth={isQuarter ? 3 : 1.6}
            strokeLinecap="round"
          />
        )
      })}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        stroke="var(--ink)"
        strokeWidth="6"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 50 50)`}
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="17"
        stroke="var(--coral)"
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 50 50)`}
      />
      <circle cx="50" cy="50" r="4" fill="var(--ink)" />
    </svg>
  )
}

function Angle({ degrees }: { degrees: number }) {
  const vx = 26
  const vy = 128
  const L = 150
  const rad = (degrees * Math.PI) / 180
  const ex = vx + L * Math.cos(rad)
  const ey = vy - L * Math.sin(rad)
  const ar = 40
  const ax = vx + ar
  const ay = vy
  const bx = vx + ar * Math.cos(rad)
  const by = vy - ar * Math.sin(rad)
  const right = Math.abs(degrees - 90) < 0.5
  return (
    <svg width="min(70vw, 220px)" viewBox="0 0 220 150" role="img" aria-label={`a ${degrees} degree angle`}>
      {/* base ray */}
      <line x1={vx} y1={vy} x2={vx + L} y2={vy} stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
      {/* second ray */}
      <line x1={vx} y1={vy} x2={ex} y2={ey} stroke="var(--grape)" strokeWidth="4" strokeLinecap="round" />
      {/* the angle arc (or a little square for a right angle) */}
      {right ? (
        <rect x={vx} y={vy - 18} width="18" height="18" fill="none" stroke="var(--coral)" strokeWidth="2.5" />
      ) : (
        <path
          d={`M ${ax} ${ay} A ${ar} ${ar} 0 0 0 ${bx} ${by}`}
          fill="none"
          stroke="var(--coral)"
          strokeWidth="2.5"
        />
      )}
      <text x={vx + 52} y={vy - 14} fontSize="16" fontWeight="700" fill="var(--coral)">
        {degrees}°
      </text>
    </svg>
  )
}
