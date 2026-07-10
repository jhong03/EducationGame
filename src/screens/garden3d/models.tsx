import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { AdditiveBlending, DoubleSide, ExtrudeGeometry, Shape, ShapeGeometry } from 'three'
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
    case 'tulip': {
      // The classic tulip: a closed cup with a pointed petal crown on a single
      // stem, flanked by the long sweeping base leaves.
      const petal = a.accent ?? '#ff6b6b'
      return (
        <group position={[0, 0.36, 0]}>
          {/* stem */}
          <mesh castShadow position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.028, 0.038, 0.4, 6]} />
            {M({ color: '#5f9a48' })}
          </mesh>
          {/* long tulip leaves sweeping up from the base */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              castShadow
              position={[s * 0.08, 0.15, 0]}
              rotation={[0, 0, s * 0.55]}
              scale={[0.28, 1, 0.42]}
            >
              <sphereGeometry args={[0.15, 8, 8]} />
              {M({ color: a.color })}
            </mesh>
          ))}
          {/* the closed cup */}
          <mesh castShadow position={[0, 0.46, 0]} scale={[0.82, 1.05, 0.82]}>
            <sphereGeometry args={[0.11, 10, 10]} />
            {M({ color: petal })}
          </mesh>
          {/* pointed petal tips forming the crown */}
          {[0, 1, 2].map((i) => {
            const t = (i / 3) * Math.PI * 2
            return (
              <mesh
                key={i}
                castShadow
                position={[Math.cos(t) * 0.055, 0.555, Math.sin(t) * 0.055]}
              >
                <coneGeometry args={[0.05, 0.1, 6]} />
                {M({ color: petal })}
              </mesh>
            )
          })}
        </group>
      )
    }
    case 'rose': {
      // A rose: layered petals cupping into a central bud (no open centre),
      // on a thorned stem with a leaf.
      const outer = '#a8232f' // deep rose red, darkest outside…
      const mid = '#c22836'
      const bud = '#d3313f' // …warming toward the centre
      return (
        <group position={[0, 0.36, 0]}>
          {/* stem */}
          <mesh castShadow position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.026, 0.036, 0.48, 6]} />
            {M({ color: a.color })}
          </mesh>
          {/* thorns */}
          {[0.14, 0.28].map((y, i) => (
            <mesh
              key={i}
              castShadow
              position={[(i % 2 ? -1 : 1) * 0.035, y, 0]}
              rotation={[0, 0, (i % 2 ? 1 : -1) * (Math.PI / 2.4)]}
            >
              <coneGeometry args={[0.012, 0.045, 4]} />
              {M({ color: '#4c7c3a' })}
            </mesh>
          ))}
          {/* leaf */}
          <mesh
            castShadow
            position={[0.07, 0.2, 0.02]}
            rotation={[0, 0.3, -0.7]}
            scale={[0.55, 0.3, 0.4]}
          >
            <sphereGeometry args={[0.11, 8, 8]} />
            {M({ color: a.color })}
          </mesh>
          {/* The head: three spiralling whorls of FLAT cupped petals (thin
              radially, tall + wide tangentially — sheets, not balls), the
              outer whorl opened outward, wrapping to a tight spiral centre. */}
          <group position={[0, 0.53, 0]}>
            {/* green sepal cup under the bloom */}
            <mesh castShadow position={[0, -0.03, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.062, 0.07, 6]} />
              {M({ color: a.color })}
            </mesh>
            {/* outer whorl — 6 opened petals */}
            {Array.from({ length: 6 }, (_, i) => {
              const t = (i / 6) * Math.PI * 2
              return (
                <group key={`o${i}`} rotation={[0, -t, 0]}>
                  <mesh
                    castShadow
                    position={[0.07, 0.02, 0]}
                    rotation={[0, 0, -0.42]}
                    scale={[0.24, 0.95, 1]}
                  >
                    <sphereGeometry args={[0.075, 8, 8]} />
                    {M({ color: outer })}
                  </mesh>
                </group>
              )
            })}
            {/* middle whorl — 4 petals, more upright, spiral-offset */}
            {Array.from({ length: 4 }, (_, i) => {
              const t = (i / 4) * Math.PI * 2 + 0.55
              return (
                <group key={`m${i}`} rotation={[0, -t, 0]}>
                  <mesh
                    castShadow
                    position={[0.042, 0.05, 0]}
                    rotation={[0, 0, -0.16]}
                    scale={[0.22, 1, 0.9]}
                  >
                    <sphereGeometry args={[0.06, 8, 8]} />
                    {M({ color: mid })}
                  </mesh>
                </group>
              )
            })}
            {/* inner whorl — 3 tight petals wrapping the centre */}
            {Array.from({ length: 3 }, (_, i) => {
              const t = (i / 3) * Math.PI * 2 + 1.1
              return (
                <group key={`i${i}`} rotation={[0, -t, 0]}>
                  <mesh
                    castShadow
                    position={[0.02, 0.075, 0]}
                    scale={[0.22, 1, 0.75]}
                  >
                    <sphereGeometry args={[0.048, 8, 8]} />
                    {M({ color: bud })}
                  </mesh>
                </group>
              )
            })}
            {/* the spiral heart */}
            <mesh position={[0, 0.095, 0]}>
              <cylinderGeometry args={[0.016, 0.02, 0.045, 8]} />
              {M({ color: '#8f1c26' })}
            </mesh>
          </group>
        </group>
      )
    }
    // NB: 'tree' never reaches PlantTop — trees plant straight into the
    // ground (TreeModel), not into a pot.
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
    case 'fern': {
      // A rosette of long, flattened frond blades arching out from a central
      // crown — outer ring leaning far out with drooping lighter tips, inner
      // ring more upright, one young vertical frond in the middle.
      const green = a.color
      const light = '#63b168'
      return (
        <group position={[0, 0.36, 0]}>
          {/* crown */}
          <mesh castShadow position={[0, 0.03, 0]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            {M({ color: '#3c7a45' })}
          </mesh>
          {/* outer ring: blades pitched ~50° out, each with a droopier tip */}
          {Array.from({ length: 7 }, (_, i) => {
            const theta = (i / 7) * Math.PI * 2
            return (
              <group key={`o${i}`} rotation={[0, theta, 0]}>
                <mesh
                  castShadow
                  position={[0.117, 0.125, 0]}
                  rotation={[0, 0, -0.9]}
                  scale={[1, 1, 0.32]}
                >
                  <coneGeometry args={[0.055, 0.3, 5]} />
                  {M({ color: green })}
                </mesh>
                <mesh
                  castShadow
                  position={[0.305, 0.222, 0]}
                  rotation={[0, 0, -1.5]}
                  scale={[1, 1, 0.3]}
                >
                  <coneGeometry args={[0.035, 0.14, 5]} />
                  {M({ color: light })}
                </mesh>
              </group>
            )
          })}
          {/* inner ring: shorter, more upright blades */}
          {Array.from({ length: 4 }, (_, i) => {
            const theta = (i / 4) * Math.PI * 2 + 0.4
            return (
              <group key={`n${i}`} rotation={[0, theta, 0]}>
                <mesh
                  castShadow
                  position={[0.05, 0.16, 0]}
                  rotation={[0, 0, -0.35]}
                  scale={[1, 1, 0.32]}
                >
                  <coneGeometry args={[0.05, 0.28, 5]} />
                  {M({ color: light })}
                </mesh>
              </group>
            )
          })}
          {/* a young frond unfurling straight up in the middle */}
          <mesh castShadow position={[0, 0.17, 0]} scale={[1, 1, 0.32]}>
            <coneGeometry args={[0.04, 0.26, 5]} />
            {M({ color: green })}
          </mesh>
        </group>
      )
    }
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
    case 'stalk': {
      // Wheat: a sheaf of thin golden stalks fanning gently outward, each
      // topped with a grain ear (kernels along the head + a bristly awn).
      const stem = '#cdb45e'
      const ear = a.color
      const kernel = '#d4ab4a'
      const STALKS = [
        { x: 0, z: 0, dir: 0, lean: 0.02, h: 0.46 },
        { x: 0.07, z: 0.03, dir: 0.4, lean: 0.16, h: 0.4 },
        { x: -0.06, z: 0.05, dir: 2.4, lean: 0.18, h: 0.42 },
        { x: 0.05, z: -0.06, dir: -0.8, lean: 0.15, h: 0.37 },
        { x: -0.05, z: -0.05, dir: -2.4, lean: 0.17, h: 0.39 },
        { x: 0.01, z: 0.08, dir: 1.5, lean: 0.14, h: 0.35 },
      ] as const
      return (
        <group position={[0, 0.36, 0]}>
          {STALKS.map(({ x, z, dir, lean, h }, i) => (
            <group key={i} position={[x, 0, z]} rotation={[0, dir, lean]}>
              {/* stem */}
              <mesh castShadow position={[0, h / 2, 0]}>
                <cylinderGeometry args={[0.008, 0.011, h, 5]} />
                {M({ color: stem })}
              </mesh>
              {/* the grain ear */}
              <mesh castShadow position={[0, h + 0.045, 0]}>
                <capsuleGeometry args={[0.026, 0.07, 3, 6]} />
                {M({ color: ear })}
              </mesh>
              {/* kernels bulging along the ear's sides */}
              {[-0.024, 0.024].map((kx, j) => (
                <mesh key={j} position={[kx, h + 0.035 + j * 0.025, 0]}>
                  <sphereGeometry args={[0.016, 6, 6]} />
                  {M({ color: kernel })}
                </mesh>
              ))}
              {/* awn — the bristle at the tip */}
              <mesh position={[0, h + 0.13, 0]}>
                <coneGeometry args={[0.005, 0.07, 4]} />
                {M({ color: ear })}
              </mesh>
            </group>
          ))}
        </group>
      )
    }
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
          {/* toadstool spots, scattered on the cap dome (r=0.2 from [0,0.34]) */}
          {(
            [
              [0.0, 0.15], // near the top
              [1.1, 0.65],
              [2.5, 0.8],
              [3.6, 0.55],
              [4.7, 0.85],
              [5.6, 0.45],
            ] as const
          ).map(([theta, phi], i) => (
            <mesh
              key={i}
              position={[
                Math.sin(phi) * Math.cos(theta) * 0.19,
                0.34 + Math.cos(phi) * 0.19,
                Math.sin(phi) * Math.sin(theta) * 0.19,
              ]}
            >
              <sphereGeometry args={[i % 2 ? 0.026 : 0.034, 8, 6]} />
              {M({ color: '#fdf8ec' })}
            </mesh>
          ))}
        </group>
      )
    case 'lotus': {
      // A lotus: pointed petals in layered whorls cupping UP around a yellow
      // seed pod, the bloom resting on a green lily pad.
      const outerPink = '#ffb7d3'
      const midPink = a.color
      const innerPink = '#f987b4'
      const whorl = (
        n: number,
        offset: number,
        r: number,
        y: number,
        lean: number,
        len: number,
        color: string,
        key: string,
      ) =>
        Array.from({ length: n }, (_, i) => {
          const t = (i / n) * Math.PI * 2 + offset
          return (
            <group key={`${key}${i}`} rotation={[0, -t, 0]}>
              <mesh
                castShadow
                position={[r, y, 0]}
                rotation={[0, 0, -lean]}
                scale={[1, 1, 0.38]}
              >
                <coneGeometry args={[0.045, len, 5]} />
                {M({ color })}
              </mesh>
            </group>
          )
        })
      return (
        <group position={[0, 0.36, 0]}>
          {/* lily pad */}
          <mesh castShadow position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.17, 0.15, 0.03, 14]} />
            {M({ color: '#4e8f4a' })}
          </mesh>
          {/* outer whorl — opened wide */}
          {whorl(8, 0, 0.095, 0.07, 0.95, 0.16, outerPink, 'o')}
          {/* middle whorl — half open */}
          {whorl(6, 0.4, 0.06, 0.1, 0.55, 0.15, midPink, 'm')}
          {/* inner whorl — nearly upright */}
          {whorl(4, 0.9, 0.03, 0.12, 0.22, 0.13, innerPink, 'i')}
          {/* yellow seed pod at the heart */}
          <mesh castShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.032, 0.04, 0.05, 10]} />
            {M({ color: a.accent ?? '#ffe08a' })}
          </mesh>
        </group>
      )
    }
    case 'tall-flower': {
      // Sunflower: a tall stalk with leaves, topped by a big flat seed disc
      // ringed by many flat pointed petals, the whole head tilted sunward.
      const petal = a.color
      const seed = a.accent ?? '#7a4a2a'
      return (
        <group position={[0, 0.36, 0]}>
          {/* stalk */}
          <mesh castShadow position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.68, 6]} />
            {M({ color: '#5f9a48' })}
          </mesh>
          {/* leaves on the stalk */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              castShadow
              position={[s * 0.1, 0.34 + (s > 0 ? 0.08 : 0), 0]}
              rotation={[0, 0, s * 0.8]}
              scale={[0.55, 0.28, 0.4]}
            >
              <sphereGeometry args={[0.14, 8, 8]} />
              {M({ color: '#5f9a48' })}
            </mesh>
          ))}
          {/* the head, tilted up toward the sun */}
          <group position={[0, 0.74, 0]} rotation={[0.6, 0, 0]}>
            {/* ring of flat pointed petals */}
            {Array.from({ length: 12 }, (_, i) => {
              const t = (i / 12) * Math.PI * 2
              return (
                <mesh
                  key={i}
                  castShadow
                  position={[Math.sin(t) * 0.13, Math.cos(t) * 0.13, 0]}
                  rotation={[0, 0, -t]}
                  scale={[1, 1, 0.3]}
                >
                  <coneGeometry args={[0.034, 0.11, 4]} />
                  {M({ color: i % 2 ? petal : '#f4c33d' })}
                </mesh>
              )
            })}
            {/* seed disc + darker centre */}
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.045, 16]} />
              {M({ color: seed })}
            </mesh>
            <mesh position={[0, 0, 0.024]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.01, 12]} />
              {M({ color: '#5e381f' })}
            </mesh>
          </group>
        </group>
      )
    }
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

/** A tree, planted straight into the lawn (NO pot): grassy mound, root
 *  flares, a proper trunk with a branch stub, and a clustered canopy. */
function TreeModel({ a }: { a: Appearance }) {
  const leaf = a.color
  const dark = '#4f8f50'
  const wood = a.accent ?? '#8a5a3c'
  return (
    <group>
      {/* grassy mound where it meets the lawn */}
      <mesh castShadow position={[0, 0.02, 0]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        {M({ color: '#6f9f4e' })}
      </mesh>
      {/* root flares */}
      {[0.5, 2.6, 4.4].map((t, i) => (
        <mesh
          key={i}
          castShadow
          position={[Math.cos(t) * 0.085, 0.06, Math.sin(t) * 0.085]}
          rotation={[0, -t, 0.55]}
        >
          <coneGeometry args={[0.035, 0.13, 5]} />
          {M({ color: wood })}
        </mesh>
      ))}
      {/* trunk + a branch stub */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.06, 0.095, 0.56, 8]} />
        {M({ color: wood })}
      </mesh>
      <mesh castShadow position={[0.1, 0.45, 0]} rotation={[0, 0, -0.9]}>
        <cylinderGeometry args={[0.02, 0.032, 0.15, 6]} />
        {M({ color: wood })}
      </mesh>
      {/* canopy — a cluster of leafy masses in two greens */}
      <mesh castShadow position={[0, 0.78, 0]}>
        <icosahedronGeometry args={[0.32, 0]} />
        {M({ color: leaf })}
      </mesh>
      <mesh castShadow position={[0.21, 0.66, 0.08]}>
        <icosahedronGeometry args={[0.2, 0]} />
        {M({ color: leaf })}
      </mesh>
      <mesh castShadow position={[-0.19, 0.68, -0.06]}>
        <icosahedronGeometry args={[0.18, 0]} />
        {M({ color: dark })}
      </mesh>
      <mesh castShadow position={[0.02, 0.62, -0.18]}>
        <icosahedronGeometry args={[0.16, 0]} />
        {M({ color: dark })}
      </mesh>
    </group>
  )
}

function PlantModel({ a }: { a: Appearance }) {
  // Trees grow from the ground; everything else lives in a terracotta pot.
  if (a.variant === 'tree') return <TreeModel a={a} />
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
      {/* pale face poking out the front — smaller, sitting higher */}
      <mesh castShadow position={[0, 0.18, 0.2]} scale={[1, 0.95, 1.12]}>
        <sphereGeometry args={[0.13, 14, 12]} />
        {M({ color: skin })}
      </mesh>
      {/* pointy snout + nose, level with the face */}
      <mesh castShadow position={[0, 0.16, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.048, 0.12, 8]} />
        {M({ color: skin })}
      </mesh>
      <mesh position={[0, 0.155, 0.395]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        {M({ color: '#2a2320' })}
      </mesh>
      {/* eyes — ON the face's surface (r=0.13 from [0,0.18,0.2]) */}
      {[-0.06, 0.06].map((x, i) => (
        <mesh key={i} position={[x, 0.225, 0.305]}>
          <sphereGeometry args={[0.021, 8, 8]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      {/* little round ears */}
      {[-0.095, 0.095].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.29, 0.15]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          {M({ color: skin })}
        </mesh>
      ))}
      {/* four small feet peeking out under the body */}
      {(
        [
          [-0.08, 0.13],
          [0.08, 0.13],
          [-0.09, -0.03],
          [0.09, -0.03],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.025, z]}>
          <sphereGeometry args={[0.032, 8, 6]} />
          {M({ color: skin })}
        </mesh>
      ))}
    </group>
  )
}

/** Turtle — a patterned shell over a belly plate, head OUT on a neck, four
 *  splayed crawling legs and a stubby tail. Authored facing +z. */
function ShellModel({ a }: { a: Appearance }) {
  const skin = a.color
  const shell = a.accent ?? '#4a7a3a'
  const plate = '#3c6531'
  return (
    <group>
      {/* belly plate (plastron) */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.185, 0.165, 0.06, 14]} />
        {M({ color: '#cbb97e' })}
      </mesh>
      {/* the shell dome */}
      <mesh castShadow position={[0, 0.09, 0]} scale={[1, 0.72, 1.05]}>
        <sphereGeometry args={[0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {M({ color: shell })}
      </mesh>
      {/* shell plates: one on top, four around the slope */}
      <mesh position={[0, 0.225, 0]} scale={[1, 0.3, 1]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        {M({ color: plate })}
      </mesh>
      {[0.8, 2.4, 3.9, 5.5].map((t, i) => (
        <mesh
          key={i}
          position={[Math.cos(t) * 0.115, 0.16, Math.sin(t) * 0.12]}
          scale={[1, 0.35, 1]}
          rotation={[Math.sin(t) * 0.5, 0, Math.cos(t) * -0.5]}
        >
          <sphereGeometry args={[0.055, 8, 6]} />
          {M({ color: plate })}
        </mesh>
      ))}
      {/* neck + head, poking out the front */}
      <mesh castShadow position={[0, 0.1, 0.18]} rotation={[1.25, 0, 0]}>
        <capsuleGeometry args={[0.036, 0.09, 3, 8]} />
        {M({ color: skin })}
      </mesh>
      <mesh castShadow position={[0, 0.14, 0.26]}>
        <sphereGeometry args={[0.065, 12, 10]} />
        {M({ color: skin })}
      </mesh>
      {/* eyes */}
      {[-0.028, 0.028].map((x, i) => (
        <mesh key={i} position={[x, 0.165, 0.31]}>
          <sphereGeometry args={[0.014, 6, 6]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      {/* four legs splayed diagonally, mid-crawl */}
      {(
        [
          [0.15, 0.11, 0.55, -0.75],
          [-0.15, 0.11, 0.55, 0.75],
          [0.15, -0.11, -0.55, -0.75],
          [-0.15, -0.11, -0.55, 0.75],
        ] as const
      ).map(([x, z, rx, rz], i) => (
        <mesh key={i} castShadow position={[x, 0.05, z]} rotation={[rx, 0, rz]}>
          <capsuleGeometry args={[0.032, 0.07, 3, 6]} />
          {M({ color: skin })}
        </mesh>
      ))}
      {/* stubby tail */}
      <mesh castShadow position={[0, 0.06, -0.19]} rotation={[-1.9, 0, 0]}>
        <coneGeometry args={[0.022, 0.06, 5]} />
        {M({ color: skin })}
      </mesh>
    </group>
  )
}

/** The pastel gradient the unicorn's mane + tail flow through. */
const UNICORN_MANE = ['#ffb4d9', '#d9b4ff', '#b4d0ff', '#b4f0e0', '#fff0b4']

/**
 * Unicorn — the garden's most precious pet, built like a real (tiny) horse:
 * pearl coat, proud arched neck with a cascading pastel mane, golden spiral
 * horn, golden hooves (one foreleg raised mid-prance), a flowing rainbow tail —
 * and magic star-sparkles twinkling around it. Authored facing +z.
 */
function UnicornModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  const coat = a.color
  const gold = '#f0c34a'
  const sparkles = useRef<(Mesh | null)[]>([])
  useFrame((s) => {
    if (reducedMotion) return
    const t = s.clock.elapsedTime
    sparkles.current.forEach((m, i) => {
      if (!m) return
      const tw = Math.pow(0.5 + 0.5 * Math.sin(t * 2.8 + i * 1.9), 2)
      ;(m.material as MeshBasicMaterial).opacity = 0.25 + 0.75 * tw
      m.scale.setScalar(0.55 + 0.55 * tw)
      m.rotation.z += 0.012
      m.position.y = SPARKLES[i][1] + Math.sin(t * 1.1 + i * 2.1) * 0.04
    })
  })
  return (
    <group>
      {/* body — a horse barrel, horizontal */}
      <mesh castShadow position={[0, 0.28, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.11, 0.2, 4, 12]} />
        {M({ color: coat })}
      </mesh>
      {/* chest + haunches fill the silhouette */}
      <mesh castShadow position={[0, 0.29, 0.1]}>
        <sphereGeometry args={[0.1, 12, 10]} />
        {M({ color: coat })}
      </mesh>
      <mesh castShadow position={[0, 0.29, -0.15]} scale={[1.1, 1, 1]}>
        <sphereGeometry args={[0.1, 12, 10]} />
        {M({ color: coat })}
      </mesh>
      {/* proud arched neck, rising up-forward */}
      <mesh castShadow position={[0, 0.42, 0.13]} rotation={[0.35, 0, 0]}>
        <capsuleGeometry args={[0.055, 0.15, 4, 10]} />
        {M({ color: coat })}
      </mesh>
      {/* head held high, muzzle reaching forward-down */}
      <mesh castShadow position={[0, 0.54, 0.18]}>
        <sphereGeometry args={[0.085, 12, 10]} />
        {M({ color: coat })}
      </mesh>
      <mesh castShadow position={[0, 0.51, 0.27]} rotation={[1.2, 0, 0]}>
        <capsuleGeometry args={[0.042, 0.08, 3, 8]} />
        {M({ color: coat })}
      </mesh>
      {/* eyes — ON the head surface (r=0.085 from [0,0.54,0.18]) */}
      {[-0.06, 0.06].map((x, i) => (
        <mesh key={i} position={[x, 0.565, 0.24]}>
          <sphereGeometry args={[0.017, 8, 6]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      {/* pink muzzle tip */}
      <mesh position={[0, 0.475, 0.315]}>
        <sphereGeometry args={[0.024, 8, 6]} />
        {M({ color: '#f0b6c8' })}
      </mesh>
      {/* ears */}
      {[-0.045, 0.045].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.635, 0.15]} rotation={[0.1, 0, x * 4]}>
          <coneGeometry args={[0.022, 0.06, 5]} />
          {M({ color: coat })}
        </mesh>
      ))}
      {/* the golden spiral horn — tapered, ringed, softly glowing */}
      <group position={[0, 0.61, 0.2]} rotation={[0.45, 0, 0]}>
        <mesh castShadow position={[0, 0.085, 0]}>
          <coneGeometry args={[0.028, 0.18, 8]} />
          <meshStandardMaterial
            color={gold}
            emissive={gold}
            emissiveIntensity={0.35}
            flatShading
            roughness={0.4}
          />
        </mesh>
        {/* spiral grooves */}
        {[
          [0.045, 0.021],
          [0.095, 0.015],
          [0.14, 0.009],
        ].map(([y, r], i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.005, 6, 12]} />
            {M({ color: '#d9a92c' })}
          </mesh>
        ))}
      </group>
      {/* the mane — a pastel cascade down the back of the neck + forelock */}
      {(
        [
          [0.015, 0.655, 0.13, 0.042],
          [-0.02, 0.615, 0.075, 0.046],
          [0.02, 0.565, 0.03, 0.048],
          [-0.015, 0.5, -0.005, 0.046],
          [0.01, 0.43, -0.03, 0.042],
        ] as const
      ).map(([x, y, z, r], i) => (
        <mesh key={i} castShadow position={[x, y, z]}>
          <sphereGeometry args={[r, 8, 8]} />
          {M({ color: UNICORN_MANE[i % UNICORN_MANE.length] })}
        </mesh>
      ))}
      {/* forelock peeking under the horn */}
      <mesh castShadow position={[0, 0.64, 0.21]}>
        <sphereGeometry args={[0.032, 8, 6]} />
        {M({ color: UNICORN_MANE[0] })}
      </mesh>
      {/* slender legs — the left foreleg raised mid-prance */}
      <mesh castShadow position={[-0.065, 0.17, 0.14]} rotation={[-0.7, 0, 0]}>
        <capsuleGeometry args={[0.024, 0.11, 3, 8]} />
        {M({ color: coat })}
      </mesh>
      <mesh castShadow position={[-0.065, 0.115, 0.195]}>
        <cylinderGeometry args={[0.027, 0.025, 0.026, 8]} />
        {M({ color: gold })}
      </mesh>
      {(
        [
          [0.065, 0.1],
          [-0.065, -0.14],
          [0.065, -0.14],
        ] as const
      ).map(([x, z], i) => (
        <group key={i}>
          <mesh castShadow position={[x, 0.12, z]}>
            <capsuleGeometry args={[0.024, 0.14, 3, 8]} />
            {M({ color: coat })}
          </mesh>
          <mesh castShadow position={[x, 0.016, z]}>
            <cylinderGeometry args={[0.027, 0.025, 0.03, 8]} />
            {M({ color: gold })}
          </mesh>
        </group>
      ))}
      {/* the tail — a rainbow cascade sweeping down and back */}
      {(
        [
          [0, 0.36, -0.26, 0.05],
          [0.02, 0.29, -0.31, 0.046],
          [-0.015, 0.21, -0.345, 0.04],
          [0.01, 0.13, -0.37, 0.034],
        ] as const
      ).map(([x, y, z, r], i) => (
        <mesh key={i} castShadow position={[x, y, z]}>
          <sphereGeometry args={[r, 8, 8]} />
          {M({ color: UNICORN_MANE[(i + 1) % UNICORN_MANE.length] })}
        </mesh>
      ))}
      {/* magic — billboarded star-sparkles twinkling around the unicorn */}
      {SPARKLES.map(([x, y, z, c], i) => (
        <Billboard key={i} position={[x, y, z]}>
          <mesh
            ref={(m) => {
              sparkles.current[i] = m
            }}
            geometry={STAR_GEOM}
            scale={0.8}
          >
            <meshBasicMaterial
              color={c}
              transparent
              opacity={0.8}
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  )
}

/** Where the unicorn's sparkles float (x, y, z, colour). */
const SPARKLES: readonly [number, number, number, string][] = [
  [0.26, 0.52, 0.12, '#ffe08a'],
  [-0.24, 0.68, -0.04, '#ffd0e6'],
  [0.16, 0.78, -0.16, '#d9b4ff'],
  [-0.2, 0.36, 0.22, '#b4f0e0'],
]

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
    // Authored facing +x; turned to the +z travel convention (fly nose-first).
    <group position={[0, 0.3, 0]} rotation={[0, -Math.PI / 2, 0]}>
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
      {/* eyes — ON the head's surface (head r=0.19 from [0,0.5,0.04]) */}
      {[-0.075, 0.075].map((x, i) => (
        <mesh key={i} position={[x, 0.545, 0.21]}>
          <sphereGeometry args={[0.032, 8, 8]} />
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

/** Bunny — on all fours: plump body, big haunches, tall ears, puff tail.
 *  Authored facing +x; the wrapper turns it to the +z travel convention the
 *  wander animation steers by (so it hops nose-first, not sideways). */
function BunnyModel({ a }: { a: Appearance }) {
  const fur = a.color
  const pink = a.accent ?? '#ffb4c8'
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      {/* plump horizontal body */}
      <mesh castShadow position={[-0.02, 0.19, 0]} scale={[1.25, 0.92, 0.95]}>
        <sphereGeometry args={[0.19, 14, 12]} />
        {M({ color: fur })}
      </mesh>
      {/* big hind haunches */}
      {[-0.09, 0.09].map((z, i) => (
        <mesh key={i} castShadow position={[-0.14, 0.14, z]}>
          <sphereGeometry args={[0.095, 12, 10]} />
          {M({ color: fur })}
        </mesh>
      ))}
      {/* hind feet, stretched forward along the ground */}
      {[-0.09, 0.09].map((z, i) => (
        <mesh key={i} castShadow position={[-0.1, 0.035, z]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.032, 0.08, 3, 6]} />
          {M({ color: fur })}
        </mesh>
      ))}
      {/* front legs */}
      {[-0.06, 0.06].map((z, i) => (
        <mesh key={i} castShadow position={[0.13, 0.07, z]}>
          <capsuleGeometry args={[0.026, 0.08, 3, 6]} />
          {M({ color: fur })}
        </mesh>
      ))}
      {/* head, low at the front (sniffing height) */}
      <mesh castShadow position={[0.2, 0.28, 0]}>
        <sphereGeometry args={[0.13, 14, 12]} />
        {M({ color: fur })}
      </mesh>
      {/* tall ears, tilted slightly back — with pink inner faces */}
      {[-0.05, 0.05].map((z, i) => (
        <group key={i} position={[0.16, 0.44, z]} rotation={[0, 0, 0.22]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.032, 0.17, 3, 6]} />
            {M({ color: fur })}
          </mesh>
          <mesh position={[0.02, 0.01, 0]} scale={[0.5, 0.75, 0.6]}>
            <capsuleGeometry args={[0.03, 0.15, 3, 6]} />
            {M({ color: pink })}
          </mesh>
        </group>
      ))}
      {/* eyes */}
      {[-0.055, 0.055].map((z, i) => (
        <mesh key={i} position={[0.3, 0.31, z]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      {/* pink nose */}
      <mesh position={[0.33, 0.27, 0]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        {M({ color: pink })}
      </mesh>
      {/* puff tail */}
      <mesh castShadow position={[-0.23, 0.22, 0]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        {M({ color: '#ffffff' })}
      </mesh>
    </group>
  )
}

/** Frog — squat and neckless, bulging eyes on TOP, wide mouth, folded
 *  haunches, webbed feet. Authored facing +z (hops nose-first). */
function FrogModel({ a }: { a: Appearance }) {
  const skin = a.color
  const belly = a.accent ?? '#e7f3cf'
  return (
    <group>
      {/* squat, wide body (head and body are one — frogs have no neck) */}
      <mesh castShadow position={[0, 0.14, 0]} scale={[1.15, 0.8, 1.1]}>
        <sphereGeometry args={[0.17, 14, 12]} />
        {M({ color: skin })}
      </mesh>
      {/* lighter belly/chin patch */}
      <mesh position={[0, 0.1, 0.09]} scale={[0.85, 0.6, 0.55]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        {M({ color: belly })}
      </mesh>
      {/* bulging eyes on TOP: green bump → white eye → pupil */}
      {[-0.08, 0.08].map((x, i) => (
        <group key={i}>
          <mesh castShadow position={[x, 0.26, 0.05]}>
            <sphereGeometry args={[0.055, 10, 8]} />
            {M({ color: skin })}
          </mesh>
          <mesh position={[x, 0.28, 0.085]}>
            <sphereGeometry args={[0.036, 10, 8]} />
            {M({ color: '#f7f5ee' })}
          </mesh>
          <mesh position={[x, 0.285, 0.115]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            {M({ color: '#2a2320' })}
          </mesh>
        </group>
      ))}
      {/* nostrils */}
      {[-0.028, 0.028].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0.185]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          {M({ color: '#3c6e33' })}
        </mesh>
      ))}
      {/* the wide mouth line */}
      <mesh position={[0, 0.12, 0.17]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.008, 0.13, 3, 6]} />
        {M({ color: '#3c6e33' })}
      </mesh>
      {/* big folded hind haunches + webbed feet splayed forward */}
      {[-0.145, 0.145].map((x, i) => (
        <group key={i}>
          <mesh castShadow position={[x, 0.09, -0.04]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            {M({ color: skin })}
          </mesh>
          <mesh castShadow position={[x, 0.02, 0.05]} scale={[0.55, 0.28, 1]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            {M({ color: skin })}
          </mesh>
        </group>
      ))}
      {/* little front legs down from the chest */}
      {[-0.07, 0.07].map((x, i) => (
        <group key={i}>
          <mesh castShadow position={[x, 0.06, 0.12]}>
            <capsuleGeometry args={[0.02, 0.06, 3, 6]} />
            {M({ color: skin })}
          </mesh>
          <mesh castShadow position={[x, 0.015, 0.14]} scale={[0.6, 0.3, 1]}>
            <sphereGeometry args={[0.05, 8, 6]} />
            {M({ color: skin })}
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Four-legged pets (cat / puppy / fox) — a shared quadruped: horizontal body,
 *  head forward with muzzle + nose, four legs, and per-animal ears + tail.
 *  Authored facing +z (walks nose-first). */
function QuadModel({ a }: { a: Appearance }) {
  const fur = a.color
  const cream = a.accent ?? '#f5ead5'
  // The stub-tailed quad is the DOG: floppy hanging ears, a longer snout and a
  // red collar keep it from reading as a bear cub.
  const dog = a.tail === 'stub'
  // The bushy-tailed quad is the FOX: big dark-tipped ears, a long pointed
  // snout, white cheeks, black-sock legs and a huge horizontal brush tail.
  const fox = a.tail === 'bushy'
  const legColor = fox ? '#4a3a2c' : fur
  return (
    <group>
      {/* horizontal body */}
      <mesh castShadow position={[0, 0.17, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.105, 0.16, 4, 10]} />
        {M({ color: fur })}
      </mesh>
      {/* chest patch */}
      <mesh position={[0, 0.15, 0.1]} scale={[0.7, 0.7, 0.5]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        {M({ color: cream })}
      </mesh>
      {/* head, forward and up */}
      <mesh castShadow position={[0, 0.3, 0.12]}>
        <sphereGeometry args={[0.115, 12, 10]} />
        {M({ color: fur })}
      </mesh>
      {/* muzzle + nose — the dog's snout protrudes; the fox's is a long point */}
      {fox ? (
        <>
          <mesh castShadow position={[0, 0.27, 0.235]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.042, 0.13, 8]} />
            {M({ color: cream })}
          </mesh>
          {/* white cheek tufts */}
          {[-0.085, 0.085].map((x, i) => (
            <mesh key={i} position={[x, 0.275, 0.16]} scale={[0.6, 0.8, 0.7]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              {M({ color: cream })}
            </mesh>
          ))}
        </>
      ) : (
        <mesh
          castShadow
          position={[0, dog ? 0.265 : 0.27, dog ? 0.225 : 0.21]}
          scale={dog ? [1, 0.75, 1.35] : [1.1, 0.8, 0.9]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          {M({ color: cream })}
        </mesh>
      )}
      <mesh position={[0, fox ? 0.27 : 0.285, fox ? 0.305 : dog ? 0.29 : 0.255]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        {M({ color: '#2a2320' })}
      </mesh>
      {/* eyes */}
      {[-0.052, 0.052].map((x, i) => (
        <mesh key={i} position={[x, 0.33, 0.215]}>
          <sphereGeometry args={[0.02, 8, 6]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      {/* collar — the "somebody's pet" tell */}
      {dog && (
        <mesh position={[0, 0.245, 0.07]} rotation={[1.05, 0, 0]}>
          <torusGeometry args={[0.082, 0.014, 8, 16]} />
          {M({ color: '#d64550' })}
        </mesh>
      )}
      {/* ears — the dog's FLOP down the sides; others get pointy cones */}
      {a.ears === 'round'
        ? [-1, 1].map((s) => (
            <mesh
              key={s}
              castShadow
              position={[s * 0.105, 0.31, 0.1]}
              rotation={[0, 0, s * 0.3]}
              scale={[0.32, 1.15, 0.55]}
            >
              <sphereGeometry args={[0.058, 8, 8]} />
              {M({ color: fur })}
            </mesh>
          ))
        : [-0.07, 0.07].map((x, i) => (
            <group key={i}>
              {/* the fox's ears are much bigger, with dark tips */}
              <mesh
                castShadow
                position={[x, fox ? 0.44 : 0.42, 0.09]}
                rotation={[0, 0, x * 3]}
              >
                <coneGeometry args={fox ? [0.05, 0.13, 4] : [0.035, 0.09, 4]} />
                {M({ color: fur })}
              </mesh>
              {fox && (
                <mesh position={[x * 0.8, 0.505, 0.09]} rotation={[0, 0, x * 3]}>
                  <coneGeometry args={[0.022, 0.05, 4]} />
                  {M({ color: '#3a2d22' })}
                </mesh>
              )}
            </group>
          ))}
      {/* four legs */}
      {(
        [
          [-0.06, 0.09],
          [0.06, 0.09],
          [-0.06, -0.11],
          [0.06, -0.11],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.055, z]}>
          <capsuleGeometry args={[0.024, 0.08, 3, 6]} />
          {M({ color: legColor })}
        </mesh>
      ))}
      {/* tail, per animal */}
      {a.tail === 'curl' && (
        <group>
          <mesh castShadow position={[0, 0.26, -0.19]} rotation={[-0.45, 0, 0]}>
            <capsuleGeometry args={[0.02, 0.13, 3, 6]} />
            {M({ color: fur })}
          </mesh>
          <mesh castShadow position={[0, 0.345, -0.215]}>
            <sphereGeometry args={[0.026, 8, 6]} />
            {M({ color: cream })}
          </mesh>
        </group>
      )}
      {a.tail === 'stub' && (
        <group>
          {/* a happy upright wag-tail with a cream tip */}
          <mesh castShadow position={[0, 0.25, -0.16]} rotation={[-0.55, 0, 0]}>
            <capsuleGeometry args={[0.02, 0.09, 3, 6]} />
            {M({ color: fur })}
          </mesh>
          <mesh castShadow position={[0, 0.31, -0.19]}>
            <sphereGeometry args={[0.024, 8, 6]} />
            {M({ color: cream })}
          </mesh>
        </group>
      )}
      {a.tail === 'bushy' && (
        <group>
          {/* the brush: big, nearly horizontal, sweeping back */}
          <mesh
            castShadow
            position={[0, 0.17, -0.27]}
            rotation={[-1.35, 0, 0]}
          >
            <capsuleGeometry args={[0.055, 0.19, 4, 8]} />
            {M({ color: fur })}
          </mesh>
          <mesh castShadow position={[0, 0.21, -0.4]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            {M({ color: cream })}
          </mesh>
        </group>
      )}
    </group>
  )
}

/** Panda — sitting (as pandas do), with the REAL markings: black eye patches,
 *  ears, arms and legs on a white body. Authored facing +z. */
function PandaModel({ a }: { a: Appearance }) {
  const white = a.color
  const black = a.accent ?? '#2e2a28'
  return (
    <group>
      {/* sitting body */}
      <mesh castShadow position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.24, 14, 12]} />
        {M({ color: white })}
      </mesh>
      {/* black arms hugging round the shoulders */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          castShadow
          position={[s * 0.17, 0.3, 0.05]}
          rotation={[0.2, 0, s * 0.55]}
        >
          <capsuleGeometry args={[0.055, 0.13, 3, 8]} />
          {M({ color: black })}
        </mesh>
      ))}
      {/* black legs splayed out in front (the classic slump) */}
      {[-0.11, 0.11].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.08, 0.14]}>
          <sphereGeometry args={[0.075, 10, 8]} />
          {M({ color: black })}
        </mesh>
      ))}
      {/* head */}
      <mesh castShadow position={[0, 0.5, 0.04]}>
        <sphereGeometry args={[0.18, 14, 12]} />
        {M({ color: white })}
      </mesh>
      {/* black round ears */}
      {[-0.13, 0.13].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.63, 0.01]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          {M({ color: black })}
        </mesh>
      ))}
      {/* the iconic slanted black eye patches, with white pupils — placed ON
          the head surface (head r=0.18 from [0,0.5,0.04]; |offset| ≈ 0.182) */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh
            position={[s * 0.075, 0.545, 0.2]}
            rotation={[0, 0, s * 0.45]}
            scale={[0.72, 1.1, 0.45]}
          >
            <sphereGeometry args={[0.048, 10, 8]} />
            {M({ color: black })}
          </mesh>
          <mesh position={[s * 0.072, 0.54, 0.228]}>
            <sphereGeometry args={[0.013, 6, 6]} />
            {M({ color: '#f7f5ee' })}
          </mesh>
        </group>
      ))}
      {/* muzzle + black nose */}
      <mesh castShadow position={[0, 0.46, 0.16]} scale={[1, 0.85, 0.8]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        {M({ color: white })}
      </mesh>
      <mesh position={[0, 0.468, 0.226]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        {M({ color: black })}
      </mesh>
    </group>
  )
}

function PetModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  switch (a.variant) {
    case 'bunny':
      return <BunnyModel a={a} />
    case 'panda':
      return <PandaModel a={a} />
    case 'quad':
      return <QuadModel a={a} />
    case 'frog':
      return <FrogModel a={a} />
    case 'chick':
      return <ChickModel a={a} />
    case 'flyer':
      return <FlyerModel a={a} reducedMotion={reducedMotion} />
    case 'bee':
      return <BeeModel reducedMotion={reducedMotion} />
    case 'shell':
      return <ShellModel a={a} />
    case 'horned':
      return <UnicornModel a={a} reducedMotion={reducedMotion} />
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

/** A chunky 5-point star extruded in 3D — the Twinkle statue's silhouette. */
const TWINKLE_STATUE_GEOM = new ExtrudeGeometry(starShape(5, 0.23, 0.115), {
  depth: 0.08,
  bevelEnabled: true,
  bevelThickness: 0.015,
  bevelSize: 0.015,
  bevelSegments: 1,
})
TWINKLE_STATUE_GEOM.center()

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
    case 'pillar':
    default: {
      // The statue is TWINKLE — the meadow's own star guide, carved in stone on
      // a two-tier plinth, complete with the carved face (eyes + smile).
      const stone = a.color
      const carved = '#8f877b' // recessed/carved details read darker
      return (
        <group>
          {/* plinth */}
          <mesh castShadow position={[0, 0.05, 0]}>
            <boxGeometry args={[0.36, 0.1, 0.36]} />
            {M({ color: '#b8b0a4' })}
          </mesh>
          <mesh castShadow position={[0, 0.14, 0]}>
            <boxGeometry args={[0.26, 0.08, 0.26]} />
            {M({ color: '#a89f92' })}
          </mesh>
          {/* the star, standing upright (rotated so a spike points up) */}
          <mesh
            castShadow
            position={[0, 0.44, 0]}
            rotation={[0, 0, Math.PI]}
            geometry={TWINKLE_STATUE_GEOM}
          >
            {M({ color: stone })}
          </mesh>
          {/* carved face on the front */}
          {[-0.055, 0.055].map((x, i) => (
            <mesh key={i} position={[x, 0.47, 0.056]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              {M({ color: carved })}
            </mesh>
          ))}
          {/* smile — the bottom half of a thin torus */}
          <mesh position={[0, 0.41, 0.056]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.045, 0.011, 6, 14, Math.PI]} />
            {M({ color: carved })}
          </mesh>
          {/* rosy-cheek carvings, faint */}
          {[-0.095, 0.095].map((x, i) => (
            <mesh key={i} position={[x, 0.42, 0.052]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              {M({ color: '#9d938a' })}
            </mesh>
          ))}
        </group>
      )
    }
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
/** Hip anchor points for the four legs (built facing +x). */
const HORSE_LEGS: { x: number; z: number }[] = [
  { x: 0.095, z: -0.032 }, // front left
  { x: 0.095, z: 0.032 }, // front right
  { x: -0.095, z: -0.032 }, // rear left
  { x: -0.095, z: 0.032 }, // rear right
]

/**
 * A stylized carousel horse, built facing +x: capsule body, arched neck, head
 * with snout + ears, a mane of blobs, a tail, and a gold saddle where the brass
 * pole passes through. The four legs hinge at the HIP and trot in a loop —
 * diagonal pairs swing together (front-left with rear-right), like a real walk.
 * Hooves rest near y=0 so the parent can bob the whole horse along its pole.
 */
function CarouselHorse({
  color,
  mane,
  phase = 0,
  reducedMotion = false,
}: {
  color: string
  mane: string
  phase?: number
  reducedMotion?: boolean
}) {
  const legs = useRef<(Group | null)[]>([])
  useFrame((s) => {
    if (reducedMotion) return
    const t = s.clock.elapsedTime * 5.5 + phase
    legs.current.forEach((g, i) => {
      if (!g) return
      // Trot: legs 0 & 3 are one diagonal pair, 1 & 2 the other (anti-phase).
      const diag = i === 0 || i === 3 ? 0 : Math.PI
      g.rotation.z = Math.sin(t + diag) * 0.45
    })
  })
  return (
    <group>
      {/* body */}
      <mesh castShadow position={[0, 0.17, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.055, 0.15, 4, 10]} />
        {M({ color })}
      </mesh>
      {/* chest — fills the body-to-neck join */}
      <mesh castShadow position={[0.085, 0.185, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        {M({ color })}
      </mesh>
      {/* arched neck, rising up-forward */}
      <mesh castShadow position={[0.1, 0.25, 0]} rotation={[0, 0, -0.55]}>
        <capsuleGeometry args={[0.032, 0.11, 4, 8]} />
        {M({ color })}
      </mesh>
      {/* head */}
      <mesh castShadow position={[0.148, 0.315, 0]}>
        <sphereGeometry args={[0.037, 10, 8]} />
        {M({ color })}
      </mesh>
      {/* snout, angled down-forward */}
      <mesh castShadow position={[0.19, 0.29, 0]} rotation={[0, 0, -2.1]}>
        <capsuleGeometry args={[0.02, 0.045, 3, 8]} />
        {M({ color })}
      </mesh>
      {/* eyes */}
      {[-0.03, 0.03].map((z, j) => (
        <mesh key={j} position={[0.165, 0.325, z]}>
          <sphereGeometry args={[0.009, 6, 6]} />
          {M({ color: '#2a2320' })}
        </mesh>
      ))}
      {/* ears */}
      {[-0.017, 0.017].map((z, j) => (
        <mesh key={j} castShadow position={[0.132, 0.36, z]} rotation={[0, 0, 0.18]}>
          <coneGeometry args={[0.011, 0.034, 5]} />
          {M({ color })}
        </mesh>
      ))}
      {/* mane — blobs down the back of the neck + a forelock */}
      {[
        [0.122, 0.352],
        [0.095, 0.325],
        [0.07, 0.295],
        [0.05, 0.262],
      ].map(([mx, my], j) => (
        <mesh key={j} castShadow position={[mx - 0.028, my, 0]}>
          <sphereGeometry args={[0.019, 8, 6]} />
          {M({ color: mane })}
        </mesh>
      ))}
      {/* legs — hinged at the hip; swung by the trot loop above. The static
          rotation is the reduced-motion resting pose. */}
      {HORSE_LEGS.map(({ x, z }, i) => (
        <group
          key={i}
          ref={(g) => {
            legs.current[i] = g
          }}
          position={[x, 0.14, z]}
          rotation={[0, 0, i < 2 ? -0.3 : 0.35]}
        >
          <mesh castShadow position={[0, -0.058, 0]}>
            <capsuleGeometry args={[0.014, 0.09, 3, 6]} />
            {M({ color })}
          </mesh>
          {/* hoof */}
          <mesh castShadow position={[0, -0.112, 0]}>
            <cylinderGeometry args={[0.016, 0.014, 0.02, 8]} />
            {M({ color: '#5a4a3a' })}
          </mesh>
        </group>
      ))}
      {/* tail, streaming back */}
      <mesh castShadow position={[-0.14, 0.155, 0]} rotation={[0, 0, 0.95]}>
        <capsuleGeometry args={[0.017, 0.08, 3, 6]} />
        {M({ color: mane })}
      </mesh>
      {/* saddle: blanket + seat, where the pole passes through */}
      <mesh castShadow position={[0, 0.222, 0]}>
        <boxGeometry args={[0.095, 0.018, 0.095]} />
        {M({ color: '#d64550' })}
      </mesh>
      <mesh castShadow position={[0, 0.238, 0]}>
        <cylinderGeometry args={[0.036, 0.042, 0.022, 10]} />
        {M({ color: '#ffd94b' })}
      </mesh>
    </group>
  )
}

function CarouselModel({ a, reducedMotion }: { a: Appearance; reducedMotion: boolean }) {
  const spin = useRef<Group>(null)
  const horses = useRef<(Group | null)[]>([])
  useFrame((s, dt) => {
    if (reducedMotion || !spin.current) return
    spin.current.rotation.y += dt * 0.5
    // The signature carousel bob — alternate horses rise as their neighbours dip.
    horses.current.forEach((h, i) => {
      if (h) h.position.y = 0.13 + Math.sin(s.clock.elapsedTime * 2.2 + i * (Math.PI / 2)) * 0.035
    })
  })
  const horseCols = ['#ff6b6b', '#4bb3ff', '#ffcf4b', '#f6f0f7']
  const maneCols = ['#8a3f34', '#2a5a8a', '#a06a1a', '#c9a0ff']
  return (
    <group>
      {/* platform + trim band */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.42, 0.44, 0.12, 20]} />
        {M({ color: '#efe0c4' })}
      </mesh>
      <mesh position={[0, 0.115, 0]}>
        <cylinderGeometry args={[0.425, 0.425, 0.015, 20]} />
        {M({ color: a.accent ?? '#ff7aa8' })}
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
      {/* turning ring of horses, each facing its direction of travel */}
      <group ref={spin}>
        {[0, 1, 2, 3].map((i) => {
          const t = (i / 4) * Math.PI * 2
          const x = Math.cos(t) * 0.3
          const z = Math.sin(t) * 0.3
          return (
            <group key={i} position={[x, 0, z]} rotation={[0, Math.PI / 2 - t, 0]}>
              {/* brass pole (static — the horse slides along it) */}
              <mesh position={[0, 0.36, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
                {M({ color: '#c9a94a' })}
              </mesh>
              <group
                ref={(g) => {
                  horses.current[i] = g
                }}
                position={[0, 0.13, 0]}
              >
                <CarouselHorse
                  color={horseCols[i]}
                  mane={maneCols[i]}
                  phase={i * 0.8}
                  reducedMotion={reducedMotion}
                />
              </group>
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
