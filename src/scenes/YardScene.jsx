import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Box, RBox, Cyl, Sph, Solid, WalkFloor, Door, Plant } from '../components/Prims'
import { Baekgu, Squirrel, Persimmon } from '../components/Animals'
import { Rain } from '../components/Effects'
import { getTex, rng } from '../lib/textures'

// =============================================================
//  [우리집 마당] — 비 내리는 오후, 감나무와 백구, 장독대
// =============================================================

function SkyDome() {
  const map = useMemo(() => getTex('sky'), [])
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[150, 32, 16]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  )
}

function Mountains() {
  const hills = [
    [-40, -70, 30, 14, '#5c7a55'],
    [-5, -80, 38, 18, '#6a8a5c'],
    [32, -72, 30, 15, '#57744f'],
    [62, -50, 26, 12, '#6b8758'],
    [-65, -40, 26, 11, '#61805a'],
    [-15, -55, 20, 9, '#78985f'],
    [18, -52, 18, 8, '#7c9c62'],
  ]
  return (
    <group>
      {hills.map(([x, z, r, h, c], i) => (
        <mesh key={i} position={[x, -1, z]} scale={[1, h / r, 0.7]}>
          <sphereGeometry args={[r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={c} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function StoneWall({ x, z, w, d, h = 0.9 }) {
  const map = useMemo(() => getTex('stone', Math.max(1, +(Math.max(w, d) / 2.4).toFixed(1)), 0.5), [w, d])
  return (
    <>
      <mesh position={[x, h / 2, z]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={map} roughness={1} />
      </mesh>
      <Box p={[x, h + 0.04, z]} s={[w + 0.06, 0.08, d + 0.06]} c="#8a8275" />
      <Solid x={x} z={z} w={w} d={d} />
    </>
  )
}

function House() {
  const brick = useMemo(() => getTex('brick', 6, 2.6), [])
  const brickSide = useMemo(() => getTex('brick', 4.6, 2.6), [])
  const bump = useMemo(() => getTex('brickBump', 6, 2.6), [])
  const roofTex = useMemo(() => getTex('corrugated', 3, 1), [])
  return (
    <group>
      {/* 집 몸체 (옅은 고동색 벽돌) */}
      <mesh position={[-5.5, 1.75, -8.5]} castShadow receiveShadow>
        <boxGeometry args={[9, 3.5, 7]} />
        <meshStandardMaterial attach="material-0" map={brickSide} roughness={0.95} />
        <meshStandardMaterial attach="material-1" map={brickSide} roughness={0.95} />
        <meshStandardMaterial attach="material-2" color="#6b5a4c" />
        <meshStandardMaterial attach="material-3" color="#6b5a4c" />
        <meshStandardMaterial attach="material-4" map={brick} bumpMap={bump} bumpScale={1.2} roughness={0.95} />
        <meshStandardMaterial attach="material-5" map={brick} roughness={0.95} />
      </mesh>
      <Solid x={-5.5} z={-8.5} w={9} d={7} />
      {/* 기와 지붕 */}
      <Box p={[-5.5, 4.35, -6.8]} s={[10, 0.2, 4.4]} r={[0.42, 0, 0]} c="#57493f" rough={0.7} />
      <Box p={[-5.5, 4.35, -10.2]} s={[10, 0.2, 4.4]} r={[-0.42, 0, 0]} c="#57493f" rough={0.7} />
      <Box p={[-5.5, 5.15, -8.5]} s={[10.1, 0.24, 0.3]} c="#463a32" />
      {Array.from({ length: 20 }).map((_, i) => (
        <Cyl key={i} p={[-10.25 + i * 0.5, 3.62, -4.95]} args={[0.08, 0.08, 0.2, 8]} r={[Math.PI / 2, 0, 0]} c="#4d4038" />
      ))}
      {/* 창문 */}
      {[-8.4, -2.6].map((x) => (
        <group key={x} position={[x, 1.75, -4.99]}>
          <Box p={[0, 0, 0]} s={[1.5, 1.1, 0.05]} c="#ffe3a8" emissive="#ffc46b" ei={0.55} rough={0.3} />
          <Box p={[0, 0, 0.04]} s={[0.06, 1.1, 0.06]} c="#5a3d2a" />
          <Box p={[0, 0, 0.04]} s={[1.5, 0.06, 0.06]} c="#5a3d2a" />
          <Box p={[0, 0.6, 0.05]} s={[1.7, 0.1, 0.12]} c="#5a3d2a" />
          <Box p={[0, -0.6, 0.08]} s={[1.8, 0.1, 0.2]} c="#5a3d2a" />
          <Plant p={[-0.5, -0.65, 0.2]} s={0.45} flowers="#e86f88" />
          <Plant p={[0.5, -0.65, 0.2]} s={0.45} flowers="#f2c14e" />
        </group>
      ))}
      {/* 현관문 → 거실 */}
      <Door p={[-5.5, 0.06, -4.98]} to="living" label="🚪 거실로 들어가기" color="#9a6440" glass />
      <Box p={[-5.5, 0.06, -4.6]} s={[1.8, 0.12, 0.6]} c="#a8a196" />
      {/* 처마(골함석 차양) + 기둥 */}
      <mesh position={[-5.5, 3.0, -3.75]} rotation={[-Math.PI / 2 + 0.12, 0, 0]} castShadow receiveShadow>
        <planeGeometry args={[9.4, 2.7]} />
        <meshStandardMaterial map={roofTex} side={THREE.DoubleSide} roughness={0.6} metalness={0.15} />
      </mesh>
      <Box p={[-5.5, 2.83, -2.42]} s={[9.4, 0.08, 0.1]} c="#4f7a5a" />
      {[-9.6, -6.9, -3.6, -1.4].map((x) => (
        <group key={x}>
          <Cyl p={[x, 1.42, -2.5]} args={[0.07, 0.07, 2.84, 10]} c="#3f6e55" rough={0.5} />
          <Solid x={x} z={-2.5} r={0.1} />
        </group>
      ))}
      {/* 툇마루 바닥 */}
      <Box p={[-5.5, 0.03, -3.75]} s={[9, 0.06, 2.5]} c="#b9b1a5" rough={0.8} cast={false} />
    </group>
  )
}

function Clothesline() {
  const plaid = useMemo(() => getTex('plaidRed', 1.5, 2), [])
  return (
    <group>
      <Cyl p={[-8.25, 2.5, -2.6]} args={[0.012, 0.012, 2.7, 6]} r={[0, 0, Math.PI / 2]} c="#ddd" />
      <mesh position={[-8.9, 1.85, -2.6]} castShadow>
        <boxGeometry args={[1.0, 1.3, 0.02]} />
        <meshStandardMaterial map={plaid} roughness={1} />
      </mesh>
      <Box p={[-7.9, 2.1, -2.6]} s={[0.45, 0.75, 0.02]} c="#f7f3ea" />
      <Box p={[-7.35, 2.15, -2.6]} s={[0.4, 0.65, 0.02]} c="#7f9bbd" />
      {[-9.35, -8.45, -8.1, -7.7, -7.5, -7.18].map((x) => (
        <Box key={x} p={[x, 2.5, -2.6]} s={[0.03, 0.08, 0.04]} c="#e8c25a" />
      ))}
    </group>
  )
}

function Pyeongsang() {
  // 평상 + 감 바구니
  return (
    <group position={[-8.3, 0, -3.8]}>
      <Box p={[0, 0.42, 0]} s={[1.7, 0.08, 1.1]} c="#a27148" rough={0.7} map={getTex('woodLight', 1, 1)} />
      {[[-0.75, -0.48], [0.75, -0.48], [-0.75, 0.48], [0.75, 0.48]].map(([x, z]) => (
        <Box key={x + '' + z} p={[x, 0.2, z]} s={[0.1, 0.4, 0.1]} c="#7a5236" />
      ))}
      <Cyl p={[0.2, 0.53, 0.1]} args={[0.24, 0.18, 0.14, 16]} c="#b08850" map={getTex('wicker', 2, 1)} />
      {[[0.1, 0.63, 0.05], [0.28, 0.63, 0.15], [0.2, 0.68, 0.0], [0.3, 0.62, -0.02], [0.12, 0.62, 0.2]].map((p, i) => (
        <Persimmon key={i} p={p} s={1.2} />
      ))}
    </group>
  )
}

function DogHouse({ p }) {
  return (
    <group position={p} rotation={[0, -0.6, 0]}>
      <Box p={[0, 0.45, 0]} s={[1.0, 0.9, 1.1]} c="#d9c3a0" map={getTex('woodLight', 1, 1)} />
      <Box p={[-0.29, 1.05, 0]} s={[0.72, 0.08, 1.25]} r={[0, 0, 0.7]} c="#4f79a8" rough={0.6} />
      <Box p={[0.29, 1.05, 0]} s={[0.72, 0.08, 1.25]} r={[0, 0, -0.7]} c="#4f79a8" rough={0.6} />
      <mesh position={[0, 0.4, 0.56]}>
        <circleGeometry args={[0.28, 20, 0, Math.PI]} />
        <meshStandardMaterial color="#2a211b" />
      </mesh>
      <Box p={[0, 0.22, 0.555]} s={[0.56, 0.36, 0.01]} c="#2a211b" />
      <Cyl p={[0.55, 0.05, 0.75]} args={[0.15, 0.12, 0.1, 16]} c="#c0c0c0" metal={0.6} rough={0.3} />
    </group>
  )
}

function Limb({ a, b, r = 0.08, c = '#6b4a34' }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    return { pos: va.clone().add(vb).multiplyScalar(0.5), quat: q, len: dir.length() }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r * 0.7, r, len, 8]} />
      <meshStandardMaterial color={c} roughness={1} />
    </mesh>
  )
}

function PersimmonTree({ x, z }) {
  const fruits = useMemo(() => {
    const r = rng(17)
    const arr = []
    const blobs = [
      [0, 3.4, 0, 1.4],
      [1.1, 3.0, 0.3, 1.0],
      [-1.1, 3.1, -0.2, 1.05],
      [0.3, 3.0, 1.0, 0.95],
      [-0.2, 3.0, -1.0, 0.95],
      [0.4, 4.1, 0.1, 0.9],
    ]
    for (let i = 0; i < 46; i++) {
      const b = blobs[Math.floor(r() * blobs.length)]
      const th = r() * Math.PI * 2
      const ph = Math.acos(r() * 1.6 - 0.8)
      arr.push([b[0] + Math.sin(ph) * Math.cos(th) * b[3], b[1] + Math.cos(ph) * b[3] * 0.9, b[2] + Math.sin(ph) * Math.sin(th) * b[3]])
    }
    return { arr, blobs }
  }, [])
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 1.2, 0]} args={[0.2, 0.32, 2.4, 12]} c="#6b4a34" rough={1} />
      <Cyl p={[0.55, 2.35, 0.1]} args={[0.08, 0.13, 1.4, 8]} r={[0, 0, -0.9]} c="#6b4a34" />
      <Cyl p={[-0.6, 2.45, -0.05]} args={[0.08, 0.13, 1.4, 8]} r={[0, 0, 0.95]} c="#6b4a34" />
      {/* 다람쥐가 앉는 가지 */}
      <Limb a={[0, 2.1, 0]} b={[-1.4, 2.45, 1.4]} r={0.075} />
      {fruits.blobs.map(([bx, by, bz, br], i) => (
        <mesh key={i} position={[bx, by, bz]} castShadow receiveShadow>
          <icosahedronGeometry args={[br, 2]} />
          <meshStandardMaterial color={i % 2 ? '#5f8b3c' : '#6c9944'} roughness={0.95} flatShading />
        </mesh>
      ))}
      {fruits.arr.map((p, i) => (
        <Persimmon key={i} p={p} s={1.6} />
      ))}
      {/* 떨어진 감 */}
      <Persimmon p={[0.6, 0.06, 0.8]} s={1.4} />
      <Persimmon p={[-0.7, 0.06, 0.5]} s={1.4} />
    </group>
  )
}

function Jangdokdae() {
  // 장독대: 돌 단 + 옹기 항아리
  const pts = useMemo(() => {
    const p = []
    const prof = [
      [0.0, 0],
      [0.28, 0.02],
      [0.4, 0.2],
      [0.47, 0.45],
      [0.44, 0.7],
      [0.32, 0.86],
      [0.24, 0.9],
      [0.24, 0.95],
      [0.0, 0.95],
    ]
    prof.forEach(([r, y]) => p.push(new THREE.Vector2(r, y)))
    return p
  }, [])
  const jars = [
    [-1.2, 1.0],
    [-0.35, 1.15],
    [0.55, 0.9],
    [1.3, 0.75],
    [-0.8, 0.7, 0.45],
    [0.95, 0.65, 0.45],
  ]
  return (
    <group position={[1.0, 0, -8.1]}>
      <Box p={[0, 0.2, 0]} s={[3.8, 0.4, 1.6]} c="#9c958a" map={getTex('stone', 2, 0.4)} />
      {jars.map(([x, s, z = -0.15], i) => (
        <group key={i} position={[x, 0.4, z]} scale={[s, s, s]}>
          <mesh castShadow receiveShadow>
            <latheGeometry args={[pts, 24]} />
            <meshStandardMaterial color="#5a3324" roughness={0.35} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.98, 0]} castShadow>
            <sphereGeometry args={[0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
            <meshStandardMaterial color="#4d2b1e" roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Garden() {
  const cabbages = []
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 2; j++) cabbages.push([-1.6 + i * 0.62, 0.22, -0.3 + j * 0.6])
  return (
    <group position={[0.5, 0, -5.7]}>
      <Box p={[0, 0.08, 0]} s={[4.0, 0.16, 1.5]} c="#6b4b36" rough={1} />
      {cabbages.map((p, i) => (
        <group key={i} position={p}>
          <Sph rad={0.2} sc={[1, 0.75, 1]} c={i % 3 ? '#8fbf5a' : '#a6cf6e'} seg={12} />
          <Sph p={[0, 0.06, 0]} rad={0.13} c="#c7e39a" seg={10} />
        </group>
      ))}
      {/* 울타리 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Box key={'a' + i} p={[-2.05 + i * 0.373, 0.3, 0.8]} s={[0.06, 0.6, 0.06]} c="#9b7650" />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <Box key={'b' + i} p={[-2.05 + i * 0.373, 0.3, -0.8]} s={[0.06, 0.6, 0.06]} c="#9b7650" />
      ))}
      {[0.8, -0.8].map((z) => (
        <group key={z}>
          <Box p={[0, 0.45, z]} s={[4.15, 0.05, 0.04]} c="#a6825a" />
          <Box p={[0, 0.2, z]} s={[4.15, 0.05, 0.04]} c="#a6825a" />
        </group>
      ))}
      {[-2.07, 2.07].map((x) => (
        <group key={x}>
          <Box p={[x, 0.45, 0]} s={[0.04, 0.05, 1.6]} c="#a6825a" />
          <Box p={[x, 0.2, 0]} s={[0.04, 0.05, 1.6]} c="#a6825a" />
        </group>
      ))}
    </group>
  )
}

function Gate() {
  return (
    <group>
      {[-0.1, 3.1].map((z) => (
        <group key={z}>
          <Box p={[10.2, 0.75, z]} s={[0.6, 1.5, 0.6]} c="#c9bfae" map={getTex('stone', 0.4, 0.4)} />
          <Solid x={10.2} z={z} w={0.6} d={0.6} />
        </group>
      ))}
      <Box p={[10.2, 0.6, 1.5]} s={[0.08, 1.1, 2.6]} c="#8a6142" map={getTex('woodLight', 2, 1)} />
      <Solid x={10.2} z={1.5} w={0.3} d={2.6} />
      {/* 빨간 우체통 */}
      <group position={[10.2, 1.5, -0.1]}>
        <Box p={[0, 0.25, 0]} s={[0.32, 0.36, 0.45]} c="#c9372c" rough={0.5} />
        <Cyl p={[0, 0.43, 0]} args={[0.16, 0.16, 0.45, 12, 1]} r={[Math.PI / 2, 0, 0]} c="#c9372c" rough={0.5} />
      </group>
      {/* 대문 등 */}
      <group position={[10.2, 1.5, 3.1]}>
        <Box p={[0, 0.25, 0]} s={[0.24, 0.3, 0.24]} c="#ffd58a" emissive="#ffb347" ei={1.2} />
        <Box p={[0, 0.43, 0]} s={[0.32, 0.06, 0.32]} c="#3a2e27" />
        <pointLight position={[0, 0.25, 0]} color="#ffb85c" intensity={2.5} distance={5} decay={1.5} />
      </group>
    </group>
  )
}

function SteppingStones() {
  const stones = [
    [-5.5, -1.9],
    [-4.9, -1.0],
    [-4.0, -0.3],
    [-3.0, 0.3],
    [-1.9, 0.8],
    [-0.8, 1.2],
    [0.4, 1.4],
    [1.6, 1.5],
    [2.8, 1.6],
    [4.0, 1.7],
    [5.2, 1.8],
    [6.4, 1.7],
    [7.6, 1.6],
    [8.8, 1.5],
  ]
  return stones.map(([x, z], i) => (
    <mesh key={i} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, i]} receiveShadow>
      <circleGeometry args={[0.32 + (i % 3) * 0.04, 10]} />
      <meshStandardMaterial color="#b8b1a3" roughness={0.9} />
    </mesh>
  ))
}

export default function YardScene() {
  return (
    <group>
      <SkyDome />
      <fog attach="fog" args={['#d2d0c6', 24, 95]} />
      <hemisphereLight args={['#dfe4ea', '#6b7d4a', 0.95]} />
      <ambientLight intensity={0.22} color="#ffe9cf" />
      <directionalLight
        position={[9, 15, 9]}
        intensity={1.5}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <pointLight position={[-5.5, 2.6, -4.2]} color="#ffc070" intensity={2} distance={6} decay={1.5} />

      <WalkFloor w={140} d={140} tex="grass" rep={[45, 45]} p={[0, 0, 0]} rough={1} />
      <Mountains />
      <House />
      <Clothesline />
      <Pyeongsang />
      <Solid x={-8.3} z={-3.8} w={1.75} d={1.15} />
      <SteppingStones />
      <PersimmonTree x={5.5} z={-5.0} />
      <Solid x={5.5} z={-5.0} r={0.38} />
      <Squirrel position={[4.38, 2.45, -3.88]} rotation={0.2} />
      <DogHouse p={[7.3, 0, -1.2]} />
      <Solid x={7.3} z={-1.2} r={0.78} />
      <Baekgu position={[5.4, 0, -0.6]} rotation={-0.5} />
      <Solid x={5.4} z={-0.6} r={0.42} />
      <Jangdokdae />
      <Solid x={1.0} z={-8.1} w={3.9} d={1.7} />
      <Garden />
      <Solid x={0.5} z={-5.7} w={4.2} d={1.7} />
      <Gate />

      {/* 돌담 */}
      <StoneWall x={4.6} z={-9.3} w={11.8} d={0.5} />
      <StoneWall x={10.2} z={-4.8} w={0.5} d={9.0} />
      <StoneWall x={10.2} z={5.25} w={0.5} d={4.3} />
      <StoneWall x={-10.25} z={1.1} w={0.5} d={12.2} />
      {/* 앞쪽 경계: 카메라 시야를 가리지 않도록 낮은 꽃밭 + 보이지 않는 충돌체 */}
      <Solid x={0} z={7.4} w={20.9} d={0.5} />
      {Array.from({ length: 14 }).map((_, i) => (
        <Plant key={'fb' + i} p={[-9.5 + i * 1.46, 0, 7.6]} s={0.7} flowers={['#f2a6c0', '#ffe08a', '#c9a3e6', '#ffffff'][i % 4]} />
      ))}

      {/* 화분과 수국 */}
      <Plant p={[-1.2, 0, -4.4]} s={1.3} flowers="#9bb8e8" />
      <Solid x={-1.2} z={-4.4} r={0.3} />
      <Plant p={[-3.4, 0, -4.5]} s={1.0} flowers="#f2a6c0" />
      <Solid x={-3.4} z={-4.5} r={0.24} />
      <Plant p={[9.3, 0, 3.9]} s={1.4} flowers="#c9a3e6" />
      <Solid x={9.3} z={3.9} r={0.32} />
      <Plant p={[9.3, 0, -0.9]} s={1.2} flowers="#f5f0f5" />
      <Solid x={9.3} z={-0.9} r={0.3} />

      <Rain
        count={1100}
        area={[34, 28]}
        center={[0, -1]}
        height={14}
        exclude={[
          [-10.2, -0.8, -5.0, -2.35, 3.1],
          [-10.2, -0.8, -12, -5, 5.4],
        ]}
      />
    </group>
  )
}
