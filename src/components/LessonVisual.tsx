import type { LessonVisual as Visual } from '../content/lessons'

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
  }
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
