import { useRef, useState, type ComponentRef } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MOUSE, TOUCH, Vector3, type Group } from 'three'
import { gardenItemById, isLivelyKind, type GardenItem } from '../../content/garden'
import { ItemModel } from './models'
import { modelScale, isFlyer } from './appearance'

/**
 * Garden3D — the real 3D garden (lazy-loaded; only mounts when WebGL is
 * available). A grass ground, a warm sun with soft shadows, and the child's
 * collection built from procedural low-poly models: plants sit in pots on a
 * grid, pets wander the lawn. Tap the ground to plant a held item; tap a placed
 * item (or a pet) to pick it up.
 *
 * Camera (PC + touch): left-drag / one finger orbits (adjusts the angle),
 * right-drag / two fingers pans across the lawn, wheel / pinch zooms. Panning
 * is clamped near the garden so it can't be lost off-screen.
 *
 * Motion honours prefers-reduced-motion: pets hold still.
 */

const COLS = 5
const ROWS = 6
const SLOTS = COLS * ROWS
const SP = 1.15 // grid spacing (world units)
const CX = (COLS - 1) / 2
const CZ = (ROWS - 1) / 2
// Where the camera looks by default; a stable ref so enabling pan doesn't reset
// the look-at point on every re-render. Pan is clamped near the garden.
const TARGET: [number, number, number] = [0, 0.3, 0]
const PAN_LIMIT = 3.6

function slotToPos(slot: number): [number, number, number] {
  const c = slot % COLS
  const r = Math.floor(slot / COLS)
  return [(c - CX) * SP, 0, (r - CZ) * SP]
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function posToSlot(x: number, z: number): number {
  const c = clamp(Math.round(x / SP + CX), 0, COLS - 1)
  const r = clamp(Math.round(z / SP + CZ), 0, ROWS - 1)
  return r * COLS + c
}

interface Garden3DProps {
  garden: Record<string, string>
  selected: string | null
  onPlace: (slot: number) => void
  onRemove: (slot: number) => void
  reducedMotion: boolean
}

export default function Garden3D({
  garden,
  selected,
  onPlace,
  onRemove,
  reducedMotion,
}: Garden3DProps) {
  const [hover, setHover] = useState<number | null>(null)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)

  // Keep the panned focus near the garden so it can never be lost off-screen.
  function clampPan() {
    const c = controls.current
    if (!c) return
    c.target.x = clamp(c.target.x, -PAN_LIMIT, PAN_LIMIT)
    c.target.z = clamp(c.target.z, -PAN_LIMIT, PAN_LIMIT)
  }

  // Split the layout into static (grid) items and wandering pets.
  const entries = Object.entries(garden)
    .map(([slot, id]) => ({ slot: Number(slot), item: gardenItemById(id) }))
    .filter((e): e is { slot: number; item: GardenItem } => !!e.item)
  const statics = entries.filter((e) => !isLivelyKind(e.item.kind))
  const pets = entries.filter((e) => isLivelyKind(e.item.kind))

  function groundMove(e: ThreeEvent<PointerEvent>) {
    if (!selected) return
    const slot = posToSlot(e.point.x, e.point.z)
    setHover((h) => (h === slot ? h : slot))
  }

  function groundTap(e: ThreeEvent<MouseEvent>) {
    // Ignore camera drags — only a genuine tap plants.
    if (e.delta > 6 || !selected) return
    onPlace(posToSlot(e.point.x, e.point.z))
  }

  const hoverFree = hover !== null && garden[String(hover)] === undefined

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 5.6, 6.6], fov: 42 }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#e7efe7']} />
      <fog attach="fog" args={['#e7efe7', 13, 24]} />

      <hemisphereLight args={['#eaf3ff', '#6f8a5a', 0.7]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[4.5, 8, 3.5]}
        intensity={1.2}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-near={1}
        shadow-camera-far={26}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />

      {/* Grass ground — the placement + roam surface. */}
      <mesh
        rotation-x={-Math.PI / 2}
        receiveShadow
        onPointerMove={groundMove}
        onPointerOut={() => setHover(null)}
        onClick={groundTap}
      >
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#8bbb64" />
      </mesh>
      {/* A mown garden bed under the grid, for a tended look. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[4.4, 40]} />
        <meshStandardMaterial color="#7cae57" />
      </mesh>

      {/* Faint tufts around the edge. */}
      {TUFTS.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]} castShadow>
          <coneGeometry args={[0.12, 0.22, 5]} />
          <meshStandardMaterial color="#6f9f4e" flatShading />
        </mesh>
      ))}

      {/* Placement target highlight (only while holding a plant/pet). */}
      {selected && hoverFree && hover !== null && (
        <mesh rotation-x={-Math.PI / 2} position={setY(slotToPos(hover), 0.03)}>
          <ringGeometry args={[0.34, 0.5, 24]} />
          <meshBasicMaterial color="#f0c34a" transparent opacity={0.85} />
        </mesh>
      )}

      {/* Static items (plants in pots, toys, decorations, buildings) — scaled
          to their real-world size relative to each other. */}
      {statics.map(({ slot, item }) => (
        <group
          key={slot}
          position={slotToPos(slot)}
          scale={modelScale(item)}
          onClick={(e) => {
            e.stopPropagation()
            if (e.delta > 6) return
            onRemove(slot)
          }}
        >
          <ItemModel item={item} reducedMotion={reducedMotion} />
        </group>
      ))}

      {/* Pets: butterflies/bees flutter through the air, everyone else strolls. */}
      {pets.map(({ slot, item }) =>
        isFlyer(item) ? (
          <FlyingPet
            key={slot}
            item={item}
            start={slotToPos(slot)}
            reducedMotion={reducedMotion}
            onRemove={() => onRemove(slot)}
          />
        ) : (
          <WanderingPet
            key={slot}
            item={item}
            start={slotToPos(slot)}
            reducedMotion={reducedMotion}
            onRemove={() => onRemove(slot)}
          />
        ),
      )}

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.12}
        minDistance={3}
        maxDistance={14}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.15}
        // Pan across the lawn (ground plane), not the screen plane.
        screenSpacePanning={false}
        panSpeed={0.9}
        target={TARGET}
        // PC: left-drag = orbit (adjust angle), right-drag = pan (move around),
        // wheel = zoom. Touch: one finger = orbit, two fingers = pan + pinch-zoom.
        mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
        onChange={clampPan}
      />
    </Canvas>
  )
}

function setY(p: [number, number, number], y: number): [number, number, number] {
  return [p[0], y, p[2]]
}

const BOUND_X = 2.7
const BOUND_Z = 3.2
function randTarget(): Vector3 {
  return new Vector3(
    (Math.random() * 2 - 1) * BOUND_X,
    0,
    (Math.random() * 2 - 1) * BOUND_Z,
  )
}

function WanderingPet({
  item,
  start,
  reducedMotion,
  onRemove,
}: {
  item: GardenItem
  start: [number, number, number]
  reducedMotion: boolean
  onRemove: () => void
}) {
  const ref = useRef<Group>(null)
  const st = useRef({
    pos: new Vector3(start[0], 0, start[2]),
    target: randTarget(),
    wait: 0,
    phase: Math.random() * 10,
  })

  useFrame((_, dtRaw) => {
    if (reducedMotion || !ref.current) return
    const dt = Math.min(dtRaw, 0.05) // clamp long frames (tab refocus)
    const s = st.current
    if (s.wait > 0) {
      s.wait -= dt
    } else {
      const dir = s.target.clone().sub(s.pos)
      dir.y = 0
      const dist = dir.length()
      if (dist < 0.12) {
        s.target = randTarget()
        s.wait = 0.6 + Math.random() * 1.8 // pause between strolls
      } else {
        dir.normalize()
        s.pos.addScaledVector(dir, Math.min(0.55 * dt, dist))
        ref.current.rotation.y = Math.atan2(dir.x, dir.z)
      }
    }
    s.phase += dt * 9
    const bob = s.wait > 0 ? 0 : Math.abs(Math.sin(s.phase)) * 0.05
    ref.current.position.set(s.pos.x, bob, s.pos.z)
  })

  return (
    <group
      ref={ref}
      position={start}
      onClick={(e) => {
        e.stopPropagation()
        if (e.delta > 6) return
        onRemove()
      }}
    >
      <group scale={modelScale(item)}>
        <ItemModel item={item} reducedMotion={reducedMotion} />
      </group>
    </group>
  )
}

function randAir(): Vector3 {
  return new Vector3(
    (Math.random() * 2 - 1) * BOUND_X,
    0.7 + Math.random() * 0.8,
    (Math.random() * 2 - 1) * BOUND_Z,
  )
}

/** A butterfly/bee: flits through the air with a fluttering, weaving path. */
function FlyingPet({
  item,
  start,
  reducedMotion,
  onRemove,
}: {
  item: GardenItem
  start: [number, number, number]
  reducedMotion: boolean
  onRemove: () => void
}) {
  const ref = useRef<Group>(null)
  const st = useRef({
    pos: new Vector3(start[0], 0.95, start[2]),
    target: randAir(),
    phase: Math.random() * 10,
  })

  useFrame((_, dtRaw) => {
    if (reducedMotion || !ref.current) return
    const dt = Math.min(dtRaw, 0.05)
    const s = st.current
    const dir = s.target.clone().sub(s.pos)
    const dist = dir.length()
    if (dist < 0.3) {
      s.target = randAir()
    } else {
      dir.normalize()
      s.pos.addScaledVector(dir, Math.min(0.85 * dt, dist))
      ref.current.rotation.y = Math.atan2(dir.x, dir.z)
    }
    s.phase += dt * 6
    ref.current.position.set(s.pos.x, s.pos.y + Math.sin(s.phase * 2.4) * 0.09, s.pos.z)
    ref.current.rotation.z = Math.sin(s.phase * 2.4) * 0.25
  })

  return (
    <group
      ref={ref}
      position={[start[0], 0.95, start[2]]}
      onClick={(e) => {
        e.stopPropagation()
        if (e.delta > 6) return
        onRemove()
      }}
    >
      <group scale={modelScale(item)}>
        <ItemModel item={item} reducedMotion={reducedMotion} />
      </group>
    </group>
  )
}

// A handful of decorative grass tufts scattered off the tended bed.
const TUFTS: [number, number][] = [
  [-4.2, -3.6],
  [4.1, -3.2],
  [-3.9, 3.4],
  [4.3, 3.1],
  [-4.6, 0.4],
  [4.6, -0.5],
  [0.5, -4.4],
  [-1.2, 4.4],
  [2.4, 4.2],
  [-3.2, -4.1],
]

export { SLOTS }
