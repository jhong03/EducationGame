import { useEffect, useRef, type ComponentRef, type MutableRefObject } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MOUSE, TOUCH, Vector3, type Group, type Mesh } from 'three'
import {
  gardenItemById,
  isLivelyKind,
  floatHeight,
  type GardenItem,
} from '../../content/garden'
import type { PlacedItem } from '../../engine/types'
import { ItemModel } from './models'
import { modelScale, isFlyer } from './appearance'

/**
 * Garden3D — the real 3D garden (lazy-loaded; only mounts when WebGL is
 * available). Placement is free: with a tray item held (`active`), tap the
 * ground to drop it at that exact spot (a gold ring previews the drop).
 *
 * Tapping a PLACED item SELECTS it (it never removes directly): the item gets
 * a selection ring and the camera glides over and FOLLOWS it — wandering pets
 * are tracked live as they stroll. The DOM layer then offers Move / Put back;
 * in move mode ground taps relocate the item. All ground taps route through
 * `onGround` and item taps through `onTapItem` — the screen owns the rules.
 *
 * Camera (PC + touch): left-drag / one finger orbits, right-drag / two fingers
 * pans across the lawn (clamped near the garden), wheel / pinch zooms.
 * Motion honours prefers-reduced-motion: pets hold still, focus snaps.
 */

// Where the camera looks by default; a stable ref so enabling pan doesn't reset
// the look-at point on every re-render.
const TARGET: [number, number, number] = [0, 0.3, 0]
const PAN_LIMIT = 3.6
const PLACE_LIMIT = 3.2 // items drop within this distance of the centre

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

type Controls = ComponentRef<typeof OrbitControls>
type TargetMap = MutableRefObject<Map<string, Group | null>>

interface Garden3DProps {
  garden: PlacedItem[]
  /** A drop/move is in progress — show the preview ring on the ground. */
  active: boolean
  /** The selected placed item (its key), or null. Camera focuses/follows it. */
  focusKey: string | null
  onGround: (x: number, z: number) => void
  onTapItem: (key: string) => void
  reducedMotion: boolean
}

export default function Garden3D({
  garden,
  active,
  focusKey,
  onGround,
  onTapItem,
  reducedMotion,
}: Garden3DProps) {
  const controls = useRef<Controls>(null)
  const ring = useRef<Mesh>(null)
  // Live scene nodes per placed key — how the camera follows wandering pets.
  const targets = useRef(new Map<string, Group | null>())

  // Keep the panned focus near the garden so it can never be lost off-screen.
  function clampPan() {
    const c = controls.current
    if (!c) return
    c.target.x = clamp(c.target.x, -PAN_LIMIT, PAN_LIMIT)
    c.target.z = clamp(c.target.z, -PAN_LIMIT, PAN_LIMIT)
  }

  // Hide the placement ring whenever no drop/move is in progress.
  useEffect(() => {
    if (!active && ring.current) ring.current.visible = false
  }, [active])

  const placed = garden
    .map((p) => ({ p, item: gardenItemById(p.itemId) }))
    .filter((e): e is { p: PlacedItem; item: GardenItem } => !!e.item)
  const statics = placed.filter((e) => !isLivelyKind(e.item.kind))
  const pets = placed.filter((e) => isLivelyKind(e.item.kind))

  // Follow the pointer with the preview ring — pure ref writes, no re-renders.
  function groundMove(e: ThreeEvent<PointerEvent>) {
    if (!active || !ring.current) return
    ring.current.position.set(
      clamp(e.point.x, -PLACE_LIMIT, PLACE_LIMIT),
      0.03,
      clamp(e.point.z, -PLACE_LIMIT, PLACE_LIMIT),
    )
    ring.current.visible = true
  }

  function groundTap(e: ThreeEvent<MouseEvent>) {
    if (e.delta > 6) return // a camera drag, not a tap
    onGround(
      clamp(e.point.x, -PLACE_LIMIT, PLACE_LIMIT),
      clamp(e.point.z, -PLACE_LIMIT, PLACE_LIMIT),
    )
  }

  function tapItem(e: ThreeEvent<MouseEvent>, key: string) {
    e.stopPropagation()
    if (e.delta > 6) return
    onTapItem(key)
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 5.6, 6.6], fov: 42 }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#e7efe7']} />
      <fog attach="fog" args={['#e7efe7', 14, 26]} />

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
        onPointerOut={() => {
          if (ring.current) ring.current.visible = false
        }}
        onClick={groundTap}
      >
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#8bbb64" />
      </mesh>
      {/* A mown garden bed for a tended look. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[4.6, 40]} />
        <meshStandardMaterial color="#7cae57" />
      </mesh>

      {/* Faint tufts around the edge. */}
      {TUFTS.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]} castShadow>
          <coneGeometry args={[0.12, 0.22, 5]} />
          <meshStandardMaterial color="#6f9f4e" flatShading />
        </mesh>
      ))}

      {/* Placement preview ring — positioned imperatively as the pointer moves. */}
      <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.26, 0.4, 28]} />
        <meshBasicMaterial color="#f0c34a" transparent opacity={0.85} />
      </mesh>

      {/* Static items (plants/toys/decor/buildings) at their placed (x,z); ones
          that float sit at their air height, the rest rest on the ground. */}
      {statics.map(({ p, item }) => (
        <group
          key={p.key}
          ref={(g) => {
            targets.current.set(p.key, g)
          }}
          position={[p.x, floatHeight(item), p.z]}
          scale={modelScale(item)}
          onClick={(e) => tapItem(e, p.key)}
        >
          <ItemModel item={item} reducedMotion={reducedMotion} />
          {focusKey === p.key && <SelectionRing />}
        </group>
      ))}

      {/* Pets: butterflies/bees flutter through the air, everyone else strolls. */}
      {pets.map(({ p, item }) =>
        isFlyer(item) ? (
          <FlyingPet
            key={p.key}
            item={item}
            start={[p.x, 0, p.z]}
            reducedMotion={reducedMotion}
            selected={focusKey === p.key}
            register={(g) => targets.current.set(p.key, g)}
            onTap={(e) => tapItem(e, p.key)}
          />
        ) : (
          <WanderingPet
            key={p.key}
            item={item}
            start={[p.x, 0, p.z]}
            reducedMotion={reducedMotion}
            selected={focusKey === p.key}
            register={(g) => targets.current.set(p.key, g)}
            onTap={(e) => tapItem(e, p.key)}
          />
        ),
      )}

      <CameraRig
        controls={controls}
        targets={targets}
        focusKey={focusKey}
        reducedMotion={reducedMotion}
      />

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

/**
 * While an item is selected, glide the camera's look-at point onto it and KEEP
 * following (wandering pets drag the camera along as they stroll). Deselecting
 * simply stops the pull — the camera stays where it is.
 */
function CameraRig({
  controls,
  targets,
  focusKey,
  reducedMotion,
}: {
  controls: MutableRefObject<Controls | null>
  targets: TargetMap
  focusKey: string | null
  reducedMotion: boolean
}) {
  const goal = useRef(new Vector3())
  useFrame((_, dt) => {
    const c = controls.current
    if (!c || !focusKey) return
    const g = targets.current.get(focusKey)
    if (!g) return
    goal.current.set(g.position.x, g.position.y + 0.35, g.position.z)
    if (reducedMotion) c.target.copy(goal.current)
    else c.target.lerp(goal.current, Math.min(1, dt * 3.5))
  })
  return null
}

/** The gold halo under a selected item. */
function SelectionRing() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
      <ringGeometry args={[0.3, 0.38, 28]} />
      <meshBasicMaterial color="#f0c34a" transparent opacity={0.9} depthWrite={false} />
    </mesh>
  )
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
  selected,
  register,
  onTap,
}: {
  item: GardenItem
  start: [number, number, number]
  reducedMotion: boolean
  selected: boolean
  register: (g: Group | null) => void
  onTap: (e: ThreeEvent<MouseEvent>) => void
}) {
  const ref = useRef<Group | null>(null)
  const st = useRef({
    pos: new Vector3(start[0], 0, start[2]),
    target: randTarget(),
    wait: 0,
    phase: Math.random() * 10,
  })

  // The wander state lives in refs, so a MOVE (new stored x/z) must be synced
  // in explicitly — otherwise the pet ignores it and keeps strolling.
  const [sx, , sz] = start
  useEffect(() => {
    const s = st.current
    s.pos.set(sx, 0, sz)
    s.target = randTarget()
    s.wait = 0.8 // settle at the new home for a beat before wandering on
    ref.current?.position.set(sx, 0, sz)
  }, [sx, sz])

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
      ref={(g) => {
        ref.current = g
        register(g)
      }}
      position={start}
      onClick={onTap}
    >
      <group scale={modelScale(item)}>
        <ItemModel item={item} reducedMotion={reducedMotion} />
      </group>
      {selected && <SelectionRing />}
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
  selected,
  register,
  onTap,
}: {
  item: GardenItem
  start: [number, number, number]
  reducedMotion: boolean
  selected: boolean
  register: (g: Group | null) => void
  onTap: (e: ThreeEvent<MouseEvent>) => void
}) {
  const ref = useRef<Group | null>(null)
  const st = useRef({
    pos: new Vector3(start[0], 0.95, start[2]),
    target: randAir(),
    phase: Math.random() * 10,
  })

  // Same move-sync as WanderingPet: a new stored x/z snaps the flight state.
  const [sx, , sz] = start
  useEffect(() => {
    const s = st.current
    s.pos.set(sx, 0.95, sz)
    s.target = randAir()
    ref.current?.position.set(sx, 0.95, sz)
  }, [sx, sz])

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
      ref={(g) => {
        ref.current = g
        register(g)
      }}
      position={[start[0], 0.95, start[2]]}
      onClick={onTap}
    >
      <group scale={modelScale(item)}>
        <ItemModel item={item} reducedMotion={reducedMotion} />
      </group>
      {selected && <SelectionRing />}
    </group>
  )
}

// A handful of decorative grass tufts scattered off the tended bed.
const TUFTS: [number, number][] = [
  [-4.4, -3.8],
  [4.3, -3.4],
  [-4.1, 3.6],
  [4.5, 3.3],
  [-4.8, 0.4],
  [4.8, -0.5],
  [0.5, -4.6],
  [-1.2, 4.6],
  [2.4, 4.4],
  [-3.4, -4.3],
]
