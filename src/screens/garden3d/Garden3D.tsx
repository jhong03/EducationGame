import { useEffect, useRef, type ComponentRef } from 'react'
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
 * available). A grass ground, a warm sun with soft shadows, and the child's
 * collection built from procedural low-poly models. Placement is FREE: tap the
 * ground anywhere to drop a held item at that exact spot (ground items rest on
 * the lawn, floating items hover); tap a placed item (or a pet) to pick it up.
 * A gold ring follows the pointer to preview where the drop will land.
 *
 * Camera (PC + touch): left-drag / one finger orbits (adjusts the angle),
 * right-drag / two fingers pans across the lawn, wheel / pinch zooms. Panning
 * is clamped near the garden so it can't be lost off-screen.
 *
 * Motion honours prefers-reduced-motion: pets hold still.
 */

// Where the camera looks by default; a stable ref so enabling pan doesn't reset
// the look-at point on every re-render.
const TARGET: [number, number, number] = [0, 0.3, 0]
const PAN_LIMIT = 3.6
const PLACE_LIMIT = 3.2 // items drop within this distance of the centre

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

interface Garden3DProps {
  garden: PlacedItem[]
  selected: string | null
  onPlace: (x: number, z: number) => void
  onRemove: (key: string) => void
  reducedMotion: boolean
}

export default function Garden3D({
  garden,
  selected,
  onPlace,
  onRemove,
  reducedMotion,
}: Garden3DProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const ring = useRef<Mesh>(null)

  // Keep the panned focus near the garden so it can never be lost off-screen.
  function clampPan() {
    const c = controls.current
    if (!c) return
    c.target.x = clamp(c.target.x, -PAN_LIMIT, PAN_LIMIT)
    c.target.z = clamp(c.target.z, -PAN_LIMIT, PAN_LIMIT)
  }

  // Hide the placement ring whenever nothing is held.
  useEffect(() => {
    if (!selected && ring.current) ring.current.visible = false
  }, [selected])

  const placed = garden
    .map((p) => ({ p, item: gardenItemById(p.itemId) }))
    .filter((e): e is { p: PlacedItem; item: GardenItem } => !!e.item)
  const statics = placed.filter((e) => !isLivelyKind(e.item.kind))
  const pets = placed.filter((e) => isLivelyKind(e.item.kind))

  // Follow the pointer with the preview ring — pure ref writes, no re-renders.
  function groundMove(e: ThreeEvent<PointerEvent>) {
    if (!selected || !ring.current) return
    ring.current.position.set(
      clamp(e.point.x, -PLACE_LIMIT, PLACE_LIMIT),
      0.03,
      clamp(e.point.z, -PLACE_LIMIT, PLACE_LIMIT),
    )
    ring.current.visible = true
  }

  function groundTap(e: ThreeEvent<MouseEvent>) {
    if (e.delta > 6 || !selected) return // ignore camera drags — a tap plants
    onPlace(
      clamp(e.point.x, -PLACE_LIMIT, PLACE_LIMIT),
      clamp(e.point.z, -PLACE_LIMIT, PLACE_LIMIT),
    )
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
          position={[p.x, floatHeight(item), p.z]}
          scale={modelScale(item)}
          onClick={(e) => {
            e.stopPropagation()
            if (e.delta > 6) return
            onRemove(p.key)
          }}
        >
          <ItemModel item={item} reducedMotion={reducedMotion} />
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
            onRemove={() => onRemove(p.key)}
          />
        ) : (
          <WanderingPet
            key={p.key}
            item={item}
            start={[p.x, 0, p.z]}
            reducedMotion={reducedMotion}
            onRemove={() => onRemove(p.key)}
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
