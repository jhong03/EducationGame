import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { AdditiveBlending, DoubleSide, Shape, ShapeGeometry } from 'three'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import type { GardenItem } from '../../content/garden'
import { appearanceFor, type Appearance, type Ears } from './appearance'

/**
 * Procedural low-poly models for the 3D garden — built entirely from three.js
 * primitives (no external assets), so the whole shop renders in real 3D with
 * soft shadows and no download cost. Each catalogue item maps to an archetype
 * tinted per item; a few (kite, fairy lights, fountain, carousel, flyers)
 * self-animate via useFrame (honouring `reducedMotion`).
 *
 * Flat shading + low-segment geometry gives the faceted, storybook look.
 * Relative sizes come from modelScale() so a cottage dwarfs a bunny.
 */

const DIRT = '#5b3d2e'
const POT = '#c0704a'

function M({ color, ...rest }: { color: string; [k: string]: unknown }) {
  return <meshStandardMaterial color={color} flatShading roughness={0.85} {...rest} />
}

// ---- Plants -----------------------------------------------------------------

function Pot() {
  return (
    <group>
      <mesh castShadow position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.26, 0.19, 0.32, 10]} />
        {M({ color: POT })}
      </mesh>
      <mesh castShadow position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.28, 0.26, 0.06, 10]} />
        {M({ color: '#a85d3c' })}
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.04, 10]} />
        {M({ color: DIRT })}
      </mesh>
    </group>
  )
}

function Bloom({ color }: { color: string }) {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const t = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} castShadow position={[Math.cos(t) * 0.11, 0, Math.sin(t) * 0.11]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            {M({ color })}
          </mesh>
        )
      })}
      <mesh castShadow position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        {M({ color: '#ffe08a' })}
      </mesh>
    </group>
  )
}

function PlantTop({ a }: { a: Appearance }) {
  switch (a.variant) {
    case 'tree':
      return (
        <group position={[0, 0.36, 0]}>
          <mesh castShadow position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.36, 8]} />
            {M({ color: a.accent ?? '#8a5a3c' })}
          </mesh>
          <mesh castShadow position={[0, 0.5, 0]}>
            <icosahedronGeometry args={[0.3, 0]} />
            {M({ color: a.color })}
          </mesh>
          <mesh castShadow position={[0.16, 0.62, 0.05]}>
            <icosahedronGeometry args={[0.18, 0]} />
            {M({ color: a.color })}
          </mesh>
        </group>
      )
    case 'cactus':
      return (
        <group position={[0, 0.36, 0]}>
          <mesh castShadow position={[0, 0.26, 0]}>
            <capsuleGeometry args={[0.13, 0.4, 3, 8]} />
            {M({ color: a.color })}
          </mesh>
          <mesh castShadow position={[0.18, 0.3, 0]} rotation={[0, 0, -0.5]}>
            <capsuleGeometry args={[0.06, 0.18, 3, 6]} />
            {M({ color: a.color })}
          </mesh>
          {a.accent && (
            <mesh castShadow position={[0, 0.52, 0]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              {M({ color: a.accent })}
            </mesh>
          )}
        </group>
      )
    case 'bush':
      return (
        <group position={[0, 0.42, 0]}>
          {[
            [0, 0.05, 0, 0.2],
            [-0.15, 0, 0.05, 0.15],
            [0.15, 0, -0.03, 0.15],
            [0.02, 0.14, 0.1, 0.13],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} castShadow position={[x, y, z]}>
              <icosahedronGeometry args={[r, 0]} />
              {M({ color: a.color })}
            </mesh>
          ))}
        </group>
      )
    case 'stalk':
      return (
        <group position={[0, 0.38, 0]}>
          {[-0.08, 0, 0.08].map((x, i) => (
            <mesh key={i} castShadow position={[x, 0.22, 0]} rotation={[0, 0, x * 1.5]}>
              <coneGeometry args={[0.05, 0.5, 6]} />
              {M({ color: a.color })}
            </mesh>
          ))}
        </group>
      )
    case 'mushroom':
      return (
        <group position={[0, 0.36, 0]}>
          <mesh castShadow position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.28, 8]} />
            {M({ color: a.accent ?? '#f5ead5' })}
          </mesh>
          <mesh castShadow position={[0, 0.34, 0]}>
            <sphereGeometry args={[0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {M({ color: a.color })}
          </mesh>
        </group>
      )
    case 'lotus':
      return (
        <group position={[0, 0.36, 0]}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const t = (i / 6) * Math.PI * 2
            return (
              <mesh
                key={i}
                castShadow
                position={[Math.cos(t) * 0.13, 0.02, Math.sin(t) * 0.13]}
                rotation={[Math.PI / 3, -t, 0]}
              >
                <coneGeometry args={[0.07, 0.22, 6]} />
                {M({ color: a.color })}
              </mesh>
            )
          })}
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            {M({ color: a.accent ?? '#ffe08a' })}
          </mesh>
        </group>
      )
    case 'tall-flower':
      return (
        <group position={[0, 0.36, 0]}>
          <mesh castShadow position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.68, 6]} />
            {M({ color: '#5f9a48' })}
          </mesh>
          <group position={[0, 0.74, 0]}>
            <Bloom color={a.color} />
            <mesh position={[0, 0.02, 0]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              {M({ color: a.accent ?? '#7a4a2a' })}
            </mesh>
          </group>
        </group>
      )
    case 'flower':
    default:
      return (
        <group position={[0, 0.36, 0]}>
          <mesh castShadow position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.44, 6]} />
            {M({ color: '#5f9a48' })}
          </mesh>
          <group position={[0, 0.46, 0]}>
            <Bloom color={a.accent ?? a.color} />
          </group>
        </group>
      )
  }
}

function PlantModel({ a }: { a: Appearance }) {
  return (
    <group>
      <Pot />
      <PlantTop a={a} />
    </group>
  )
}

// ---- Pets -------------------------------------------------------------------

function EarSet({ style, color, accent }: { style: Ears; color: string; accent?: string }) {
  if (style === 'none') return null
  if (style === 'long')
    return (
      <group position={[0, 0.5, 0]}>
        {[-0.08, 0.08].map((x, i) => (
          <mesh key={i} castShadow position={[x, 0.14, -0.02]} rotation={[0.1, 0, x * 1.2]}>
            <capsuleGeometry args={[0.035, 0.22, 3, 6]} />
            {M({ color })}
          </mesh>
        ))}
      </group>
    )
  if (style === 'pointy')
    return (
      <group position={[0, 0.5, 0]}>
        {[-0.11, 0.11].map((x, i) => (
          <mesh key={i} castShadow position={[x, 0.1, 0]} rotation={[0, 0, x * 0.6]}>
            <coneGeometry args={[0.07, 0.16, 4]} />
            {M({ color })}
          </mesh>
        ))}
      </group>
    )
  return (
    <group position={[0, 0.5, 0]}>
      {[-0.13, 0.13].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.08, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          {M({ color: accent ?? color })}
        </mesh>
      ))}
    </group>
  )
}

function CritterModel({ a }: { a: Appearance }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.24, 12, 10]} />
        {M({ color: a.color })}
      </mesh>
      <mesh castShadow position={[0, 0.5, 0.04]}>
        <sphereGeometry args={[0.18, 12, 10]} />
        {M({ color: a.color })}
      </mesh>
      <EarSet style={a.ears ?? 'round'} color={a.color} accent={a.accent} />
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 0.52, 0.2]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      <mesh position={[0, 0.46, 0.21]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        {M({ color: a.accent ?? '#e08aa0' })}
      </mesh>
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.05, 0.12]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          {M({ color: a.color })}
        </mesh>
      ))}
    </group>
  )
}

/** Hedgehog: a snouted face poking from a back domed with outward spines. */
function SpikyModel({ a }: { a: Appearance }) {
  const R = 0.23
  const BODY: [number, number, number] = [0, 0.22, -0.02]
  // Rings of spines over the top + back dome (down to just past the equator),
  // each pointing radially outward; the front-lower arc is left bare for the
  // face.
  const rings = [
    { phi: 8, n: 3 },
    { phi: 30, n: 7 },
    { phi: 52, n: 10 },
    { phi: 74, n: 12 },
    { phi: 92, n: 13 },
  ]
  const spines: { theta: number; phi: number }[] = []
  for (const { phi, n } of rings) {
    const pr = (phi * Math.PI) / 180
    for (let j = 0; j < n; j++) {
      const theta = (j / n) * Math.PI * 2 + pr * 0.3
      const dy = Math.cos(pr)
      const dz = Math.sin(pr) * Math.cos(theta)
      if (dy < 0.42 && dz > 0.35) continue // clear the face area at the front
      spines.push({ theta, phi: pr })
    }
  }
  const skin = a.color
  return (
    <group>
      {/* body (slightly egg-shaped) */}
      <mesh castShadow position={BODY} scale={[1, 0.92, 1.12]}>
        <sphereGeometry args={[R, 14, 12]} />
        {M({ color: a.accent ?? '#5a4530' })}
      </mesh>
      {/* spines — each on the dome, pointing radially out */}
      {spines.map(({ theta, phi }, i) => (
        <group key={i} position={BODY} rotation={[0, theta, 0]}>
          <group rotation={[phi, 0, 0]}>
            <mesh castShadow position={[0, R + 0.07, 0]}>
              <coneGeometry args={[0.028, 0.18, 5]} />
              {M({ color: '#4a3826' })}
            </mesh>
          </group>
        </group>
      ))}
      {/* pale face poking out the front */}
      <mesh castShadow position={[0, 0.16, 0.2]} scale={[1, 0.95, 1.12]}>
        <sphereGeometry args={[0.15, 14, 12]} />
        {M({ color: skin })}
      </mesh>
      {/* pointy snout + nose */}
      <mesh castShadow position={[0, 0.13, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.055, 0.14, 8]} />
        {M({ color: skin })}
      </mesh>
      <mesh position={[0, 0.12, 0.41]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        {M({ color: '#2a2320' })}
      </mesh>
      {/* eyes */}
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0.28]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      {/* little round ears */}
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.29, 0.14]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          {M({ color: skin })}
        </mesh>
      ))}
      {/* little feet */}
      {[-0.09, 0.09].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.03, 0.1]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          {M({ color: skin })}
        </mesh>
      ))}
    </group>
  )
}

/** Turtle. */
function ShellModel({ a }: { a: Appearance }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {M({ color: a.accent ?? '#4a7a3a' })}
      </mesh>
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.1, 12]} />
        {M({ color: a.color })}
      </mesh>
      <mesh castShadow position={[0, 0.14, 0.28]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        {M({ color: a.color })}
      </mesh>
      {[-0.16, 0.16].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.06, 0.2]}>
          <capsuleGeometry args={[0.04, 0.08, 3, 6]} />
          {M({ color: a.color })}
        </mesh>
      ))}
    </group>
  )
}

/** Unicorn. */
function HornedModel({ a }: { a: Appearance }) {
  return (
    <group>
      <CritterModel a={{ ...a, ears: 'pointy', accent: a.color }} />
      <mesh castShadow position={[0, 0.68, 0.12]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.04, 0.2, 6]} />
        {M({ color: '#ffe08a' })}
      </mesh>
      <mesh castShadow position={[0, 0.52, -0.12]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        {M({ color: a.accent ?? '#c9a0ff' })}
      </mesh>
    </group>
  )
}

/** Butterfly — big patterned wings that flap; carried aloft by FlyingPet. */
function FlyerModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  useFrame((s) => {
    if (reducedMotion) return
    const f = Math.sin(s.clock.elapsedTime * 14) * 0.7
    if (left.current) left.current.rotation.y = f
    if (right.current) right.current.rotation.y = -f
  })
  const Wing = ({ side }: { side: number }) => (
    <>
      <mesh castShadow position={[side * 0.16, 0.02, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.15, 10, 8]} />
        {M({ color: a.color, side: 2 })}
      </mesh>
      <mesh castShadow position={[side * 0.13, -0.12, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        {M({ color: a.color, side: 2 })}
      </mesh>
      <mesh position={[side * 0.15, 0.02, 0.03]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        {M({ color: '#fff3d0' })}
      </mesh>
    </>
  )
  return (
    <group position={[0, 0.3, 0]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.04, 0.18, 3, 8]} />
        {M({ color: a.accent ?? '#6a4a8a' })}
      </mesh>
      {/* antennae */}
      {[-0.03, 0.03].map((x, i) => (
        <mesh key={i} position={[x, 0.14, 0]} rotation={[0, 0, x * 4]}>
          <cylinderGeometry args={[0.004, 0.004, 0.1, 4]} />
          {M({ color: '#3a2a2a' })}
        </mesh>
      ))}
      <group ref={left}>
        <Wing side={1} />
      </group>
      <group ref={right}>
        <Wing side={-1} />
      </group>
    </group>
  )
}

/** Bee — a round striped body with tiny buzzing wings and a stinger. */
function BeeModel({ reducedMotion }: { reducedMotion: boolean }) {
  const wings = useRef<Group>(null)
  useFrame((s) => {
    if (reducedMotion || !wings.current) return
    wings.current.rotation.z = Math.sin(s.clock.elapsedTime * 40) * 0.4
  })
  return (
    <group position={[0, 0.3, 0]}>
      {/* body */}
      <mesh castShadow>
        <sphereGeometry args={[0.16, 12, 10]} />
        {M({ color: '#ffcf4b' })}
      </mesh>
      {/* black stripes */}
      {[-0.05, 0.05].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.163, 0.163, 0.045, 12]} />
          {M({ color: '#2a2018' })}
        </mesh>
      ))}
      {/* head */}
      <mesh castShadow position={[0.17, 0.02, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        {M({ color: '#2a2018' })}
      </mesh>
      {/* stinger */}
      <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.03, 0.08, 6]} />
        {M({ color: '#2a2018' })}
      </mesh>
      {/* wings */}
      <group ref={wings} position={[0.02, 0.12, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.02, s * 0.08]} rotation={[s * 0.3, 0, 0]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshStandardMaterial color="#eaf4ff" transparent opacity={0.7} flatShading side={2} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Chick — a plump fluffy ball with a cone beak, tiny wings, tuft, tail, legs. */
function ChickModel({ a }: { a: Appearance }) {
  const y = a.color
  const o = a.accent ?? '#ff8f3a'
  return (
    <group>
      {/* plump body */}
      <mesh castShadow position={[0, 0.26, 0]} scale={[1, 1.05, 1]}>
        <sphereGeometry args={[0.26, 14, 12]} />
        {M({ color: y })}
      </mesh>
      {/* head tucked close on top-front */}
      <mesh castShadow position={[0, 0.5, 0.04]}>
        <sphereGeometry args={[0.19, 14, 12]} />
        {M({ color: y })}
      </mesh>
      {/* little wings */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          castShadow
          position={[s * 0.25, 0.28, 0]}
          rotation={[0, 0, -s * 0.3]}
          scale={[0.45, 1, 0.75]}
        >
          <sphereGeometry args={[0.14, 10, 8]} />
          {M({ color: y })}
        </mesh>
      ))}
      {/* head tuft feathers */}
      {[-0.05, 0, 0.05].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.68, 0]} rotation={[0, 0, x * 3.5]}>
          <coneGeometry args={[0.022, 0.1, 5]} />
          {M({ color: y })}
        </mesh>
      ))}
      {/* beak — orange cone pointing forward */}
      <mesh castShadow position={[0, 0.49, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.13, 4]} />
        {M({ color: o })}
      </mesh>
      {/* eyes */}
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 0.55, 0.16]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      {/* upturned tail */}
      <mesh castShadow position={[0, 0.36, -0.24]} rotation={[-0.7, 0, 0]}>
        <coneGeometry args={[0.08, 0.17, 6]} />
        {M({ color: y })}
      </mesh>
      {/* legs + feet */}
      {[-0.08, 0.08].map((x, i) => (
        <group key={i}>
          <mesh castShadow position={[x, 0.06, 0.02]}>
            <cylinderGeometry args={[0.014, 0.014, 0.12, 5]} />
            {M({ color: o })}
          </mesh>
          <mesh castShadow position={[x, 0.005, 0.06]}>
            <boxGeometry args={[0.08, 0.02, 0.1]} />
            {M({ color: o })}
          </mesh>
        </group>
      ))}
    </group>
  )
}

function PetModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  switch (a.variant) {
    case 'chick':
      return <ChickModel a={a} />
    case 'flyer':
      return <FlyerModel a={a} reducedMotion={reducedMotion} />
    case 'bee':
      return <BeeModel reducedMotion={reducedMotion} />
    case 'shell':
      return <ShellModel a={a} />
    case 'horned':
      return <HornedModel a={a} />
    case 'spiky':
      return <SpikyModel a={a} />
    default:
      return <CritterModel a={a} />
  }
}

// ---- Toys -------------------------------------------------------------------

/**
 * Kite — a diamond on a taut string from a ground spool, with a bow tail
 * threaded on a spine. The anchor stays FIXED (so the string always connects);
 * only a gentle wind-sway rotates the sail + tail together.
 */
function KiteModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  const fly = useRef<Group>(null)
  useFrame((s) => {
    if (reducedMotion || !fly.current) return
    const t = s.clock.elapsedTime
    fly.current.rotation.z = 0.18 + Math.sin(t * 1.4) * 0.12
    fly.current.rotation.x = Math.sin(t * 1.05) * 0.08
  })
  const bows = ['#ff6b6b', '#4bb3ff', '#ffcf4b', '#6bbf59', '#ff9ec4']
  return (
    <group>
      {/* spool peg on the ground */}
      <mesh castShadow position={[0, 0.04, 0.42]}>
        <cylinderGeometry args={[0.035, 0.035, 0.09, 8]} />
        {M({ color: '#8a5a3c' })}
      </mesh>
      {/* taut string: spool → kite (static, so it stays attached) */}
      <mesh position={[0, 0.46, 0.17]} rotation={[-0.5, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.98, 4]} />
        {M({ color: '#efe7d6' })}
      </mesh>
      {/* the flying kite + attached tail, anchored where the string ends */}
      <group ref={fly} position={[0, 0.9, -0.12]} rotation={[0, 0, 0.18]}>
        {/* diamond sail */}
        <mesh castShadow rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.32, 0.32, 0.015]} />
          {M({ color: a.color })}
        </mesh>
        {/* cross spars to the corners */}
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.45, 0.014, 0.008]} />
          {M({ color: '#f4f1e8' })}
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.014, 0.45, 0.008]} />
          {M({ color: '#f4f1e8' })}
        </mesh>
        {/* tail: a spine with bows threaded along it, hanging from the point */}
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.44, 4]} />
          {M({ color: '#d8c9a0' })}
        </mesh>
        {bows.map((c, i) => (
          <mesh
            key={i}
            position={[i % 2 ? 0.045 : -0.045, -0.28 - i * 0.088, 0.01]}
            rotation={[0, 0, Math.PI / 4]}
          >
            <boxGeometry args={[0.055, 0.055, 0.006]} />
            {M({ color: c })}
          </mesh>
        ))}
      </group>
    </group>
  )
}

function ToyModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  switch (a.variant) {
    case 'balloon':
      return (
        <group>
          <mesh castShadow position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.24, 12, 12]} />
            {M({ color: a.color })}
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <coneGeometry args={[0.05, 0.06, 6]} />
            {M({ color: a.color })}
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.34, 4]} />
            {M({ color: '#7a7068' })}
          </mesh>
        </group>
      )
    case 'disc': {
      // Yo-yo: two round halves on a short axle, standing upright, round faces
      // toward the viewer, with a string running up to a finger loop.
      const halfA = a.color
      const halfB = '#5a3fd0'
      return (
        <group>
          {/* front + back discs (faces point ±z); a narrow string groove between */}
          <mesh castShadow position={[0, 0.15, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.045, 22]} />
            {M({ color: halfA })}
          </mesh>
          <mesh castShadow position={[0, 0.15, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.045, 22]} />
            {M({ color: halfB })}
          </mesh>
          {/* axle in the groove */}
          <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} />
            {M({ color: '#d8d0e8' })}
          </mesh>
          {/* string up to a little finger loop */}
          <mesh position={[0.03, 0.36, 0]} rotation={[0, 0, -0.28]}>
            <cylinderGeometry args={[0.004, 0.004, 0.18, 4]} />
            {M({ color: '#efe7ff' })}
          </mesh>
          <mesh position={[0.08, 0.45, 0]}>
            <torusGeometry args={[0.028, 0.006, 6, 14]} />
            {M({ color: '#efe7ff' })}
          </mesh>
        </group>
      )
    }
    case 'kite':
      return <KiteModel a={a} reducedMotion={reducedMotion} />
    case 'blocks': {
      const cols = ['#ff6b6b', '#4bb3ff', '#ffcf4b']
      return (
        <group>
          {[
            [-0.12, 0.11, 0],
            [0.12, 0.11, 0],
            [0, 0.33, 0],
          ].map(([x, y, z], i) => (
            <mesh key={i} castShadow position={[x, y, z]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              {M({ color: cols[i % 3] })}
            </mesh>
          ))}
        </group>
      )
    }
    case 'plush':
      return <CritterModel a={{ ...a, ears: 'round', accent: '#7a5030' }} />
    case 'castle': {
      // Sandcastle: keep + corner towers with crenellations, a gate, windows,
      // and little flags.
      const sand = a.color
      const dark = '#a98a52'
      const towers: [number, number][] = [
        [-0.24, -0.24],
        [0.24, -0.24],
        [-0.24, 0.24],
        [0.24, 0.24],
      ]
      return (
        <group>
          {/* keep */}
          <mesh castShadow position={[0, 0.22, 0]}>
            <boxGeometry args={[0.4, 0.44, 0.4]} />
            {M({ color: sand })}
          </mesh>
          {/* gate */}
          <mesh position={[0, 0.13, 0.205]}>
            <boxGeometry args={[0.12, 0.2, 0.02]} />
            {M({ color: dark })}
          </mesh>
          <mesh position={[0, 0.24, 0.205]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 8, 1, false, 0, Math.PI]} />
            {M({ color: dark })}
          </mesh>
          {/* windows */}
          {[[-0.13, 0.32], [0.13, 0.32]].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0.205]}>
              <boxGeometry args={[0.06, 0.08, 0.02]} />
              {M({ color: dark })}
            </mesh>
          ))}
          {/* towers */}
          {towers.map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh castShadow position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.1, 0.12, 0.6, 10]} />
                {M({ color: sand })}
              </mesh>
              {/* crenellations */}
              {[0, 1, 2, 3].map((c) => {
                const t = (c / 4) * Math.PI * 2
                return (
                  <mesh key={c} castShadow position={[Math.cos(t) * 0.09, 0.63, Math.sin(t) * 0.09]}>
                    <boxGeometry args={[0.05, 0.07, 0.05]} />
                    {M({ color: sand })}
                  </mesh>
                )
              })}
              {/* flag */}
              <mesh position={[0, 0.78, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.18, 4]} />
                {M({ color: '#8a5a3c' })}
              </mesh>
              <mesh position={[0.05, 0.82, 0]}>
                <boxGeometry args={[0.09, 0.06, 0.005]} />
                {M({ color: ['#ff6b6b', '#4bb3ff', '#ffcf4b', '#6bbf59'][i] })}
              </mesh>
            </group>
          ))}
        </group>
      )
    }
    case 'ramp': {
      // Playground slide: 4 corner posts (ground → roof) carry the deck and a
      // pitched roof; a rung ladder climbs the left face; the sloped chute
      // drops to the right; and GUARD RAILS (two-bar, on balusters) enclose the
      // platform's open sides — the handrails a child holds up top.
      const wood = '#a9784a'
      const rail = '#c95f86'
      const corners: [number, number][] = [
        [-0.29, -0.13],
        [-0.29, 0.13],
        [-0.01, -0.13],
        [-0.01, 0.13],
      ]
      return (
        <group>
          {corners.map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0.4, z]}>
              <boxGeometry args={[0.045, 0.8, 0.045]} />
              {M({ color: wood })}
            </mesh>
          ))}
          {/* deck */}
          <mesh castShadow position={[-0.15, 0.48, 0]}>
            <boxGeometry args={[0.32, 0.05, 0.32]} />
            {M({ color: '#b98652' })}
          </mesh>
          {/* ladder rungs (left face) */}
          {[0.12, 0.24, 0.36].map((y, i) => (
            <mesh key={i} castShadow position={[-0.29, y, 0]}>
              <boxGeometry args={[0.05, 0.04, 0.28]} />
              {M({ color: wood })}
            </mesh>
          ))}
          {/* HANDRAILS — a guard rail around the front & back of the platform,
              each a top rail + a mid rail on balusters, in the bright accent. */}
          {[-0.14, 0.14].map((z, i) => (
            <group key={i}>
              <mesh castShadow position={[-0.15, 0.72, z]}>
                <boxGeometry args={[0.3, 0.035, 0.035]} />
                {M({ color: rail })}
              </mesh>
              <mesh castShadow position={[-0.15, 0.62, z]}>
                <boxGeometry args={[0.3, 0.028, 0.028]} />
                {M({ color: rail })}
              </mesh>
              {[-0.22, -0.08].map((x, j) => (
                <mesh key={j} castShadow position={[x, 0.6, z]}>
                  <boxGeometry args={[0.028, 0.24, 0.028]} />
                  {M({ color: rail })}
                </mesh>
              ))}
            </group>
          ))}
          {/* pitched roof */}
          <mesh castShadow position={[-0.15, 0.92, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.34, 0.22, 4]} />
            {M({ color: rail })}
          </mesh>
          {/* chute + grip walls */}
          <mesh castShadow position={[0.28, 0.27, 0]} rotation={[0, 0, -0.72]}>
            <boxGeometry args={[0.6, 0.05, 0.26]} />
            {M({ color: a.color })}
          </mesh>
          {[-0.12, 0.12].map((z, i) => (
            <mesh key={i} castShadow position={[0.28, 0.32, z]} rotation={[0, 0, -0.72]}>
              <boxGeometry args={[0.6, 0.1, 0.03]} />
              {M({ color: rail })}
            </mesh>
          ))}
        </group>
      )
    }
    case 'ball':
    default:
      return (
        <mesh castShadow position={[0, 0.22, 0]}>
          <icosahedronGeometry args={[0.22, 1]} />
          {M({ color: a.color })}
        </mesh>
      )
  }
}

// ---- Decorations ------------------------------------------------------------

/**
 * Fairy lights — a cluster of tiny magical motes floating and twinkling in the
 * air (no poles, no string): each is a bright glowing core wrapped in a soft
 * additive aura, drifting on its own gentle path.
 */
const FAIRY_LIGHTS: { x: number; y: number; z: number; c: string }[] = [
  { x: 0.0, y: 0.58, z: 0.0, c: '#fff2c0' },
  { x: -0.22, y: 0.42, z: 0.12, c: '#ffe08a' },
  { x: 0.26, y: 0.5, z: -0.08, c: '#ffd0e6' },
  { x: -0.16, y: 0.72, z: -0.14, c: '#c8e8ff' },
  { x: 0.12, y: 0.78, z: 0.18, c: '#dcffcf' },
  { x: 0.3, y: 0.32, z: 0.14, c: '#fff2c0' },
  { x: -0.3, y: 0.62, z: -0.04, c: '#ffd0e6' },
  { x: 0.06, y: 0.36, z: -0.22, c: '#ffe08a' },
  { x: -0.06, y: 0.86, z: 0.04, c: '#fff8e0' },
  { x: 0.2, y: 0.64, z: 0.06, c: '#c8e8ff' },
  { x: -0.26, y: 0.3, z: -0.12, c: '#dcffcf' },
]

/** A flat N-point star outline for the sparkle motes (built once, shared). */
function starShape(spikes: number, outer: number, inner: number): Shape {
  const s = new Shape()
  const step = Math.PI / spikes
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = i * step - Math.PI / 2
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  return s
}
const STAR_GEOM = new ShapeGeometry(starShape(4, 0.08, 0.03))

function FairyLightsModel({ reducedMotion }: { reducedMotion: boolean }) {
  const orbs = useRef<(Group | null)[]>([])
  const stars = useRef<(Mesh | null)[]>([])
  useFrame((s, dt) => {
    if (reducedMotion) return
    const t = s.clock.elapsedTime
    for (let i = 0; i < FAIRY_LIGHTS.length; i++) {
      const g = orbs.current[i]
      const base = FAIRY_LIGHTS[i]
      if (g) {
        const sx = 0.6 + (i % 3) * 0.22
        const sy = 0.8 + (i % 4) * 0.18
        g.position.set(
          base.x + Math.sin(t * sx + i) * 0.05,
          base.y + Math.sin(t * sy + i * 1.7) * 0.09,
          base.z + Math.cos(t * sx + i * 0.7) * 0.05,
        )
      }
      const star = stars.current[i]
      if (star) {
        star.rotation.z += dt * (0.5 + (i % 3) * 0.35)
        // Sharp twinkle: mostly dim with quick bright flashes.
        const tw = Math.pow(0.5 + 0.5 * Math.sin(t * 3.6 + i * 1.5), 2)
        ;(star.material as MeshBasicMaterial).opacity = 0.4 + 0.6 * tw
        star.scale.setScalar(0.7 + 0.7 * tw)
      }
    }
  })
  return (
    <group>
      {FAIRY_LIGHTS.map((L, i) => (
        <group
          key={i}
          ref={(g) => {
            orbs.current[i] = g
          }}
          position={[L.x, L.y, L.z]}
        >
          <Billboard>
            {/* soft glow halo */}
            <mesh>
              <circleGeometry args={[0.13, 18]} />
              <meshBasicMaterial
                color={L.c}
                transparent
                opacity={0.2}
                depthWrite={false}
                blending={AdditiveBlending}
              />
            </mesh>
            {/* spinning, sparkling star */}
            <mesh
              ref={(m) => {
                stars.current[i] = m
              }}
              geometry={STAR_GEOM}
            >
              <meshBasicMaterial
                color={L.c}
                transparent
                opacity={0.9}
                depthWrite={false}
                blending={AdditiveBlending}
                side={DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </Billboard>
        </group>
      ))}
    </group>
  )
}

/**
 * Garden clock — a round face on a post that FACES FORWARD (+z) and tells the
 * real system time: the hour/minute/second hands are set from `new Date()` every
 * frame (the second hand snaps per-second under reduced motion instead of
 * sweeping). The pivots are child groups at the face centre, so rotating them
 * about z spins the hands in the face plane.
 */
function ClockModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  const hour = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const second = useRef<Group>(null)
  useFrame(() => {
    const now = new Date()
    const ms = reducedMotion ? 0 : now.getMilliseconds() / 1000
    const sec = now.getSeconds() + ms
    const min = now.getMinutes() + sec / 60
    const hr = (now.getHours() % 12) + min / 60
    const D = Math.PI / 180
    if (second.current) second.current.rotation.z = -sec * 6 * D
    if (minute.current) minute.current.rotation.z = -min * 6 * D
    if (hour.current) hour.current.rotation.z = -hr * 30 * D
  })
  const face = a.accent ?? '#f5ead5'
  const frame = a.color
  return (
    <group>
      {/* base + post */}
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.14, 0.17, 0.1, 8]} />
        {M({ color: '#b8b0a4' })}
      </mesh>
      <mesh castShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.05, 0.065, 0.74, 8]} />
        {M({ color: frame })}
      </mesh>

      {/* clock head — the case FACES FORWARD (+z) */}
      <group position={[0, 0.88, 0]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.08, 24]} />
          {M({ color: frame })}
        </mesh>
        <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.165, 0.165, 0.015, 24]} />
          {M({ color: face })}
        </mesh>

        {/* hour ticks (12/3/6/9 are bigger) */}
        {Array.from({ length: 12 }, (_, i) => {
          const ang = (i / 12) * Math.PI * 2
          const big = i % 3 === 0
          return (
            <mesh
              key={i}
              position={[Math.sin(ang) * 0.14, Math.cos(ang) * 0.14, 0.055]}
              rotation={[0, 0, -ang]}
            >
              <boxGeometry args={[big ? 0.022 : 0.012, big ? 0.04 : 0.026, 0.006]} />
              {M({ color: '#3a3340' })}
            </mesh>
          )
        })}

        {/* hands — child groups pivot at the centre; each box extends up (12). */}
        <group ref={hour} position={[0, 0, 0.06]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.022, 0.1, 0.012]} />
            {M({ color: '#2a2320' })}
          </mesh>
        </group>
        <group ref={minute} position={[0, 0, 0.066]}>
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[0.015, 0.14, 0.01]} />
            {M({ color: '#2a2320' })}
          </mesh>
        </group>
        <group ref={second} position={[0, 0, 0.072]}>
          <mesh position={[0, 0.075, 0]}>
            <boxGeometry args={[0.006, 0.15, 0.006]} />
            {M({ color: '#d64550' })}
          </mesh>
        </group>
        <mesh position={[0, 0, 0.078]}>
          <sphereGeometry args={[0.02, 10, 10]} />
          {M({ color: '#2a2320' })}
        </mesh>
      </group>
    </group>
  )
}

function DecorModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  switch (a.variant) {
    case 'rock': // flat stepping stone
      return (
        <group>
          <mesh castShadow position={[0, 0.08, 0]} scale={[1.1, 0.42, 0.95]} rotation={[0, 0.4, 0]}>
            <dodecahedronGeometry args={[0.28, 0]} />
            {M({ color: a.color })}
          </mesh>
          <mesh castShadow position={[0.22, 0.05, 0.16]} scale={[1, 0.4, 1]}>
            <dodecahedronGeometry args={[0.1, 0]} />
            {M({ color: '#8b867d' })}
          </mesh>
        </group>
      )
    case 'bowl': {
      // Bird nest: a woven twiggy ring with speckled eggs.
      return (
        <group>
          <mesh castShadow position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.08, 8, 16]} />
            {M({ color: a.color })}
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.16, 0.13, 0.06, 12]} />
            {M({ color: '#6f5333' })}
          </mesh>
          {/* twigs */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const t = (i / 6) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(t) * 0.2, 0.1, Math.sin(t) * 0.2]} rotation={[0, -t, 1.2]}>
                <cylinderGeometry args={[0.008, 0.008, 0.16, 4]} />
                {M({ color: '#7a5a38' })}
              </mesh>
            )
          })}
          {/* eggs */}
          {[[-0.05, 0.02], [0.05, -0.01], [0, 0.06]].map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0.11, z]} scale={[1, 1.3, 1]}>
              <sphereGeometry args={[0.05, 10, 8]} />
              {M({ color: a.accent ?? '#eaf2e0' })}
            </mesh>
          ))}
        </group>
      )
    }
    case 'garland': {
      // Bunting: two ground posts with a string of flags hanging down.
      const flags = ['#ff6b6b', '#4bb3ff', '#ffcf4b', '#6bbf59', '#ff9ec4']
      return (
        <group>
          {[-0.42, 0.42].map((x, i) => (
            <mesh key={i} castShadow position={[x, 0.3, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
              {M({ color: '#8a6a45' })}
            </mesh>
          ))}
          {/* string */}
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.84, 0.008, 0.008]} />
            {M({ color: '#6a5a45' })}
          </mesh>
          {/* flags hanging DOWN (apex at the bottom) */}
          {flags.map((c, i) => {
            const x = -0.34 + (i / (flags.length - 1)) * 0.68
            const droop = 0.52 - Math.sin((i / (flags.length - 1)) * Math.PI) * 0.05
            return (
              <mesh key={i} castShadow position={[x, droop - 0.07, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.06, 0.14, 3]} />
                {M({ color: c })}
              </mesh>
            )
          })}
        </group>
      )
    }
    case 'lantern':
      return (
        <group>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.48, 4]} />
            {M({ color: '#5a4a3a' })}
          </mesh>
          <mesh castShadow position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial
              color={a.accent ?? '#ffd98a'}
              emissive={a.accent ?? '#ffd98a'}
              emissiveIntensity={0.6}
              flatShading
            />
          </mesh>
          <mesh castShadow position={[0, 0.44, 0]}>
            <coneGeometry args={[0.12, 0.1, 6]} />
            {M({ color: a.color })}
          </mesh>
        </group>
      )
    case 'sparkle':
      return <FairyLightsModel reducedMotion={reducedMotion} />
    case 'bench':
      return (
        <group>
          <mesh castShadow position={[0, 0.22, 0]}>
            <boxGeometry args={[0.5, 0.05, 0.18]} />
            {M({ color: a.color })}
          </mesh>
          <mesh castShadow position={[0, 0.34, -0.07]}>
            <boxGeometry args={[0.5, 0.2, 0.04]} />
            {M({ color: a.color })}
          </mesh>
          {[-0.2, 0.2].map((x, i) => (
            <mesh key={i} castShadow position={[x, 0.1, 0]}>
              <boxGeometry args={[0.05, 0.22, 0.16]} />
              {M({ color: '#6a4a30' })}
            </mesh>
          ))}
        </group>
      )
    case 'arch': {
      // Rainbow: a vertical arch standing over the spot (feet on the ground).
      const bands = ['#ff6b6b', '#ff9f4b', '#ffcf4b', '#6bbf59', '#4bb3ff']
      return (
        <group position={[0, 0, 0]}>
          {bands.map((c, i) => (
            <mesh key={i} position={[0, 0, 0]}>
              <torusGeometry args={[0.34 + i * 0.06, 0.028, 8, 24, Math.PI]} />
              {M({ color: c })}
            </mesh>
          ))}
        </group>
      )
    }
    case 'clock':
      return <ClockModel a={a} reducedMotion={reducedMotion} />
    case 'pillar': // statue — a little figure on a plinth
    default:
      return (
        <group>
          <mesh castShadow position={[0, 0.06, 0]}>
            <boxGeometry args={[0.28, 0.12, 0.28]} />
            {M({ color: '#b8b0a4' })}
          </mesh>
          <mesh castShadow position={[0, 0.32, 0]}>
            <coneGeometry args={[0.15, 0.4, 10]} />
            {M({ color: a.color })}
          </mesh>
          <mesh castShadow position={[0, 0.58, 0]}>
            <sphereGeometry args={[0.11, 12, 10]} />
            {M({ color: a.color })}
          </mesh>
          {[-0.15, 0.15].map((x, i) => (
            <mesh key={i} castShadow position={[x, 0.36, 0]} rotation={[0, 0, x * 2]}>
              <capsuleGeometry args={[0.035, 0.16, 3, 6]} />
              {M({ color: a.color })}
            </mesh>
          ))}
        </group>
      )
  }
}

// ---- Builds -----------------------------------------------------------------

/** Fountain with looping water jets + spilling droplets. */
function FountainModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  const drops = useRef<(Mesh | null)[]>([])
  const N = 8
  useFrame((s) => {
    if (reducedMotion) return
    const t = s.clock.elapsedTime
    drops.current.forEach((m, i) => {
      if (!m) return
      const ph = (t * 1.4 + i / N) % 1
      const ang = (i / N) * Math.PI * 2
      const r = 0.05 + ph * 0.28
      m.position.set(Math.cos(ang) * r, 0.52 + Math.sin(ph * Math.PI) * 0.26, Math.sin(ang) * r)
    })
  })
  const water = a.accent ?? '#7fd0e0'
  return (
    <group>
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.4, 0.42, 0.16, 16]} />
        {M({ color: a.color })}
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.05, 16]} />
        {M({ color: water })}
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.32, 8]} />
        {M({ color: a.color })}
      </mesh>
      <mesh castShadow position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.18, 0.1, 0.07, 12]} />
        {M({ color: a.color })}
      </mesh>
      {Array.from({ length: N }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            drops.current[i] = m
          }}
          position={[0, 0.52, 0]}
        >
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color={water} transparent opacity={0.85} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/** Carousel: a striped canopy over horses that turn on a platform. */
function CarouselModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  const spin = useRef<Group>(null)
  useFrame((_, dt) => {
    if (reducedMotion || !spin.current) return
    spin.current.rotation.y += dt * 0.5
  })
  const horseCols = ['#ff6b6b', '#4bb3ff', '#ffcf4b', '#f6f0f7']
  return (
    <group>
      {/* platform */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.42, 0.44, 0.12, 20]} />
        {M({ color: '#efe0c4' })}
      </mesh>
      {/* center pole */}
      <mesh castShadow position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.56, 8]} />
        {M({ color: a.color })}
      </mesh>
      {/* striped canopy */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={i} castShadow position={[0, 0.66, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
          <coneGeometry args={[0.46, 0.24, 3, 1, false, 0, Math.PI / 4]} />
          {M({ color: i % 2 ? a.accent ?? '#ff7aa8' : '#fbf5ea' })}
        </mesh>
      ))}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        {M({ color: '#ffd94b' })}
      </mesh>
      {/* turning ring of horses */}
      <group ref={spin}>
        {[0, 1, 2, 3].map((i) => {
          const t = (i / 4) * Math.PI * 2
          const x = Math.cos(t) * 0.3
          const z = Math.sin(t) * 0.3
          return (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 0.36, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
                {M({ color: '#c9a94a' })}
              </mesh>
              {/* horse body + head */}
              <mesh castShadow position={[0, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.06, 0.14, 3, 8]} />
                {M({ color: horseCols[i] })}
              </mesh>
              <mesh castShadow position={[0.1, 0.32, 0]} rotation={[0, 0, 0.6]}>
                <capsuleGeometry args={[0.035, 0.1, 3, 6]} />
                {M({ color: horseCols[i] })}
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}

function BuildModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  switch (a.variant) {
    case 'tent':
      return (
        <group>
          <mesh castShadow position={[0, 0.36, 0]}>
            <coneGeometry args={[0.42, 0.72, 4]} />
            {M({ color: a.color })}
          </mesh>
          <mesh position={[0, 0.18, 0.34]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.16, 0.34, 0.02]} />
            {M({ color: a.accent ?? '#f5ead5' })}
          </mesh>
        </group>
      )
    case 'hut':
      return (
        <group>
          <mesh castShadow position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.32, 0.34, 0.4, 12]} />
            {M({ color: a.color })}
          </mesh>
          <mesh castShadow position={[0, 0.54, 0]}>
            <coneGeometry args={[0.42, 0.34, 12]} />
            {M({ color: a.accent ?? '#8a5a3c' })}
          </mesh>
          <mesh position={[0, 0.16, 0.34]}>
            <boxGeometry args={[0.14, 0.24, 0.02]} />
            {M({ color: '#5a3a24' })}
          </mesh>
        </group>
      )
    case 'fountain':
      return <FountainModel a={a} reducedMotion={reducedMotion} />
    case 'carousel':
      return <CarouselModel a={a} reducedMotion={reducedMotion} />
    case 'bridge': {
      // Arched footbridge: a humped deck with railings and posts.
      const wood = a.color
      return (
        <group position={[0, 0.02, 0]}>
          {/* deck arch (walk surface) */}
          <mesh castShadow position={[0, 0, 0]}>
            <torusGeometry args={[0.4, 0.05, 8, 20, Math.PI]} />
            {M({ color: wood })}
          </mesh>
          {/* plank treads across the top */}
          {[-0.5, -0.25, 0, 0.25, 0.5].map((ang, i) => {
            const t = Math.PI / 2 + ang
            return (
              <mesh
                key={i}
                castShadow
                position={[Math.cos(t) * 0.4, Math.sin(t) * 0.4, 0]}
                rotation={[0, 0, t - Math.PI / 2]}
              >
                <boxGeometry args={[0.06, 0.03, 0.34]} />
                {M({ color: '#c79a66' })}
              </mesh>
            )
          })}
          {/* railings both sides */}
          {[-0.16, 0.16].map((z, i) => (
            <mesh key={i} position={[0, 0.12, z]}>
              <torusGeometry args={[0.42, 0.018, 6, 18, Math.PI]} />
              {M({ color: '#8a5a3c' })}
            </mesh>
          ))}
          {/* posts */}
          {[-0.4, 0.4].flatMap((x) =>
            [-0.16, 0.16].map((z) => (
              <mesh key={`${x}-${z}`} castShadow position={[x, 0.06, z]}>
                <boxGeometry args={[0.03, 0.14, 0.03]} />
                {M({ color: '#8a5a3c' })}
              </mesh>
            )),
          )}
        </group>
      )
    }
    case 'pagoda': {
      // A three-tier pagoda with a base, body with a door, flared roofs, and a
      // finial.
      const wall = a.color
      const roof = a.accent ?? '#c05a4a'
      const Roof = ({ y, r }: { y: number; r: number }) => (
        <group position={[0, y, 0]}>
          <mesh castShadow rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[r, 0.16, 4]} />
            {M({ color: roof })}
          </mesh>
          {/* upturned eaves */}
          <mesh position={[0, -0.02, 0]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[r * 0.98, r * 0.98, 0.02, 4]} />
            {M({ color: '#8a3f34' })}
          </mesh>
        </group>
      )
      return (
        <group>
          <mesh castShadow position={[0, 0.05, 0]}>
            <boxGeometry args={[0.52, 0.1, 0.52]} />
            {M({ color: '#cfc2a4' })}
          </mesh>
          {/* ground floor + door + windows */}
          <mesh castShadow position={[0, 0.24, 0]}>
            <boxGeometry args={[0.42, 0.28, 0.42]} />
            {M({ color: wall })}
          </mesh>
          <mesh position={[0, 0.2, 0.215]}>
            <boxGeometry args={[0.12, 0.2, 0.02]} />
            {M({ color: '#6a3a24' })}
          </mesh>
          {[[-0.13, 0.28], [0.13, 0.28]].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0.215]}>
              <boxGeometry args={[0.06, 0.06, 0.02]} />
              {M({ color: '#8a5a3c' })}
            </mesh>
          ))}
          <Roof y={0.42} r={0.42} />
          {/* upper floor */}
          <mesh castShadow position={[0, 0.56, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.3]} />
            {M({ color: wall })}
          </mesh>
          <mesh position={[0, 0.56, 0.155]}>
            <boxGeometry args={[0.1, 0.08, 0.02]} />
            {M({ color: '#8a5a3c' })}
          </mesh>
          <Roof y={0.7} r={0.32} />
          {/* top floor */}
          <mesh castShadow position={[0, 0.82, 0]}>
            <boxGeometry args={[0.2, 0.16, 0.2]} />
            {M({ color: wall })}
          </mesh>
          <Roof y={0.94} r={0.24} />
          {/* finial */}
          <mesh castShadow position={[0, 1.06, 0]}>
            <coneGeometry args={[0.03, 0.14, 8]} />
            {M({ color: '#ffcf4b' })}
          </mesh>
        </group>
      )
    }
    case 'house':
    default:
      return (
        <group>
          <mesh castShadow position={[0, 0.2, 0]}>
            <boxGeometry args={[0.5, 0.4, 0.44]} />
            {M({ color: a.color })}
          </mesh>
          <mesh castShadow position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.42, 0.28, 4]} />
            {M({ color: a.accent ?? '#c05a4a' })}
          </mesh>
          <mesh position={[0, 0.14, 0.23]}>
            <boxGeometry args={[0.14, 0.24, 0.02]} />
            {M({ color: '#6a4a30' })}
          </mesh>
          <mesh position={[0.16, 0.26, 0.23]}>
            <boxGeometry args={[0.1, 0.1, 0.02]} />
            {M({ color: '#bfe3ea' })}
          </mesh>
        </group>
      )
  }
}

// ---- Dispatcher -------------------------------------------------------------

/** The 3D model for a catalogue item (plants sit in pots; pets are critters). */
export function ItemModel({
  item,
  reducedMotion = false,
}: {
  item: GardenItem
  reducedMotion?: boolean
}) {
  const a = appearanceFor(item)
  switch (item.kind) {
    case 'plant':
      return <PlantModel a={a} />
    case 'pet':
      return <PetModel a={a} reducedMotion={reducedMotion} />
    case 'toy':
      return <ToyModel a={a} reducedMotion={reducedMotion} />
    case 'decoration':
      return <DecorModel a={a} reducedMotion={reducedMotion} />
    case 'build':
      return <BuildModel a={a} reducedMotion={reducedMotion} />
    default:
      return <PlantModel a={a} />
  }
}
