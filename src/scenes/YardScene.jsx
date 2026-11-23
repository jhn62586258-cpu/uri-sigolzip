import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Box, RBox, Cyl, Sph, Solid, WalkFloor, Door, Plant } from '../components/Prims'
import { Squirrel, Persimmon } from '../components/Animals'
import { Dog, DOG_COLORS, Cat } from '../components/Dogs'
import { Rain, Fireflies, Steam } from '../components/Effects'
import { LeafCards, canopyItems, GrassTufts } from '../components/Foliage'
import { getTex, rng } from '../lib/textures'
import { useStore } from '../lib/store'
import { useTheme } from '../lib/theme'
import { runAction } from '../lib/actions'

// =============================================================
//  [우리집 마당] — 귤나무와 다람쥐, 백구·회색이, 장독대, 우체통, 평상
// =============================================================

function SkyDome() {
  const theme = useTheme()
  const map = useMemo(() => getTex(theme.sky), [theme.sky])
  const night = theme === undefined ? false : theme.fireflies
  return (
    <group>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[150, 32, 16]} />
        <meshBasicMaterial map={map} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      {night && (
        <mesh position={[-40, 60, -110]}>
          <sphereGeometry args={[5, 24, 16]} />
          <meshBasicMaterial color="#fff6d6" fog={false} toneMapped={false} />
        </mesh>
      )}
      {theme.sky === 'skySunset' && (
        <mesh position={[90, 14, -90]}>
          <sphereGeometry args={[9, 24, 16]} />
          <meshBasicMaterial color="#ffd08a" fog={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

function Mountains() {
  const time = useStore((s) => s.time)
  const tint = time === 'night' ? 0.32 : time === 'sunset' ? 0.8 : 1
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
          <meshStandardMaterial color={new THREE.Color(c).multiplyScalar(tint)} roughness={1} />
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
  const plaster = useMemo(() => getTex('plasterOut', 3, 1.2), [])
  const plasterSide = useMemo(() => getTex('plasterOut', 2.4, 1.2), [])
  const brick = useMemo(() => getTex('brick', 6, 0.9), [])
  const bump = useMemo(() => getTex('brickBump', 6, 0.9), [])
  const roofTex = useMemo(() => getTex('corrugated', 3, 1), [])
  return (
    <group>
      {/* 집 몸체 (옅은 고동색 벽돌) */}
      <mesh position={[-5.5, 1.75, -8.5]} castShadow receiveShadow>
        <boxGeometry args={[9, 3.5, 7]} />
        <meshStandardMaterial attach="material-0" map={plasterSide} roughness={0.97} />
        <meshStandardMaterial attach="material-1" map={plasterSide} roughness={0.97} />
        <meshStandardMaterial attach="material-2" color="#6b5a4c" />
        <meshStandardMaterial attach="material-3" color="#6b5a4c" />
        <meshStandardMaterial attach="material-4" map={plaster} roughness={0.97} />
        <meshStandardMaterial attach="material-5" map={plaster} roughness={0.97} />
      </mesh>
      {/* 아랫단 빈티지 적벽돌 포인트 + 원목 띠 */}
      <mesh position={[-5.5, 0.45, -4.97]} receiveShadow>
        <planeGeometry args={[9, 0.9]} />
        <meshStandardMaterial map={brick} bumpMap={bump} bumpScale={1.2} color="#f2e6dc" roughness={0.95} />
      </mesh>
      <Box p={[-5.5, 0.93, -4.96]} s={[9.02, 0.07, 0.06]} c="#6b4a33" />
      <Box p={[-5.5, 3.42, -4.95]} s={[9.1, 0.16, 0.1]} c="#6b4a33" />
      {[-9.95, -1.05].map((x) => (
        <Box key={x} p={[x, 1.75, -4.95]} s={[0.14, 3.5, 0.1]} c="#6b4a33" />
      ))}
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

const BASKET_SPOTS = [
  [0.1, 0.63, 0.05], [0.28, 0.63, 0.15], [0.2, 0.68, 0.0], [0.3, 0.62, -0.02], [0.12, 0.62, 0.2], [0.05, 0.63, -0.08],
  [0.22, 0.72, 0.1], [0.35, 0.66, 0.08], [0.15, 0.7, -0.06], [0.26, 0.74, -0.04], [0.08, 0.7, 0.13], [0.3, 0.71, 0.18],
]

function Pyeongsang() {
  // 평상 + 귤 바구니(수확한 만큼 채워짐) + 찻잔 세트
  const n = useStore((s) => s.tangerines)
  return (
    <group position={[-8.3, 0, -3.8]}>
      <Box p={[0, 0.42, 0]} s={[1.7, 0.08, 1.1]} c="#a27148" rough={0.7} map={getTex('woodLight', 1, 1)} />
      {[[-0.75, -0.48], [0.75, -0.48], [-0.75, 0.48], [0.75, 0.48]].map(([x, z]) => (
        <Box key={x + '' + z} p={[x, 0.2, z]} s={[0.1, 0.4, 0.1]} c="#7a5236" />
      ))}
      <group onClick={(e) => (e.stopPropagation(), e.delta < 8 && runAction('tea'))}>
        <Cyl p={[0.2, 0.53, 0.1]} args={[0.24, 0.18, 0.14, 16]} c="#b08850" map={getTex('wicker', 2, 1)} />
        {BASKET_SPOTS.slice(0, n).map((p, i) => (
          <Persimmon key={i} p={[p[0], p[1], p[2] + 0.02]} s={1.2} />
        ))}
        {/* 찻주전자 + 찻잔 */}
        <group position={[0.55, 0.46, -0.2]}>
          <mesh position={[0, 0.1, 0]} scale={[1, 0.85, 1]} castShadow>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshStandardMaterial color="#e9e2d2" roughness={0.35} />
          </mesh>
          <Cyl p={[0.11, 0.12, 0]} args={[0.012, 0.02, 0.1, 8]} r={[0, 0, -0.9]} c="#e9e2d2" />
          <Cyl p={[0, 0.2, 0]} args={[0.03, 0.04, 0.03, 10]} c="#5a7a5a" />
          <Cyl p={[-0.2, 0.03, 0.12]} args={[0.045, 0.035, 0.06, 14]} c="#f4efe4" />
          <Cyl p={[-0.08, 0.03, 0.2]} args={[0.045, 0.035, 0.06, 14]} c="#f4efe4" />
          <Steam p={[-0.2, 0.07, 0.12]} n={3} scale={0.5} />
        </group>
        <Box p={[0.45, 0.47, -0.15]} s={[0.6, 0.02, 0.4]} c="#7a5236" />
      </group>
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

function TangerineTree({ x, z }) {
  const left = useStore((s) => s.treeFruit)
  const { fruits, leaves, blobs } = useMemo(() => {
    const r = rng(17)
    const blobs = [
      [0, 3.4, 0, 1.35],
      [1.05, 3.0, 0.3, 1.0],
      [-1.05, 3.1, -0.2, 1.0],
      [0.3, 2.95, 1.0, 0.95],
      [-0.2, 3.0, -1.0, 0.95],
      [0.35, 4.1, 0.1, 0.85],
    ]
    const fruits = []
    for (let i = 0; i < 40; i++) {
      const b = blobs[Math.floor(r() * blobs.length)]
      const th = r() * Math.PI * 2
      const ph = Math.acos(r() * 1.6 - 0.8)
      fruits.push([b[0] + Math.sin(ph) * Math.cos(th) * b[3] * 0.95, b[1] + Math.cos(ph) * b[3] * 0.85, b[2] + Math.sin(ph) * Math.sin(th) * b[3] * 0.95])
    }
    return { fruits, blobs, leaves: canopyItems(blobs, 150, 7) }
  }, [])
  return (
    <group position={[x, 0, z]} onClick={(e) => (e.stopPropagation(), e.delta < 8 && runAction('harvest'))}>
      <Cyl p={[0, 1.2, 0]} args={[0.17, 0.3, 2.4, 12]} c="#6b4a34" rough={1} />
      <Limb a={[0, 2.1, 0]} b={[0.9, 2.9, 0.2]} r={0.1} />
      <Limb a={[0, 2.2, 0]} b={[-0.9, 3.0, -0.2]} r={0.1} />
      <Limb a={[0, 2.3, 0]} b={[0.2, 3.1, 0.9]} r={0.08} />
      <Limb a={[0, 2.4, 0]} b={[-0.1, 3.0, -0.9]} r={0.08} />
      {/* 다람쥐가 앉는 가지 */}
      <Limb a={[0, 2.1, 0]} b={[-1.4, 2.45, 1.4]} r={0.075} />
      {/* 수관: 어두운 속 + 잎 카드 군집 */}
      {blobs.map(([bx, by, bz, br], i) => (
        <mesh key={i} position={[bx, by, bz]} scale={0.72}>
          <icosahedronGeometry args={[br, 1]} />
          <meshStandardMaterial color="#3f5a26" roughness={1} />
        </mesh>
      ))}
      <LeafCards items={leaves} tex="leafCluster" />
      {fruits.slice(0, left).map((p, i) => (
        <Persimmon key={i} p={p} s={1.5} />
      ))}
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
      <group position={[10.2, 1.5, -0.1]} onClick={(e) => (e.stopPropagation(), e.delta < 8 && runAction('letter'))}>
        <Box p={[0, 0.25, 0]} s={[0.32, 0.36, 0.45]} c="#c9372c" rough={0.5} />
        <Box p={[-0.165, 0.3, 0]} s={[0.01, 0.04, 0.22]} c="#3a2a22" />
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
  const th = useTheme()
  const Y = th.yard
  return (
    <group>
      <SkyDome />
      <fog attach="fog" args={[th.fog, th.fogRange[0], th.fogRange[1]]} />
      <hemisphereLight args={Y.hemi} />
      <ambientLight intensity={Y.amb} color="#ffe9cf" />
      <directionalLight
        position={Y.sunPos}
        intensity={Y.sunI}
        color={Y.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <pointLight position={[-5.5, 2.6, -4.2]} color="#ffc070" intensity={th.fireflies ? 4 : 2} distance={7} decay={1.5} />

      <WalkFloor w={140} d={140} tex="grass" rep={[45, 45]} p={[0, 0, 0]} rough={1} />
      <Mountains />
      <House />
      <Clothesline />
      <Pyeongsang />
      <Solid x={-8.3} z={-3.8} w={1.75} d={1.15} />
      <SteppingStones />
      <TangerineTree x={5.5} z={-5.0} />
      <Solid x={5.5} z={-5.0} r={0.38} />
      <Squirrel position={[4.38, 2.45, -3.88]} rotation={0.2} />
      <DogHouse p={[7.6, 0, -1.6]} />
      <Solid x={7.6} z={-1.6} r={0.78} />
      {/* 강아지 두 마리: 흰둥이 해리 + 회색 복실이 */}
      <Dog start={[5.2, -0.4]} center={[5.6, 0.1]} phase={0} colors={DOG_COLORS.baekgu} name="해리" />
      <Dog start={[6.2, 0.6]} center={[5.6, 0.1]} phase={Math.PI} colors={DOG_COLORS.gray} name="복실이" />
      {/* 툇마루 위 마시멜로 고양이 */}
      <Cat position={[-2.4, 0.06, -3.75]} rotation={0.3} />
      <Solid x={-2.4} z={-3.75} r={0.28} />
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

      <GrassTufts count={240} area={[19.5, 15.5]} center={[0, -0.9]} avoid={[[-10.3, -0.8, -9.5, -2.3], [-1.6, 2.6, -9, -4.9], [3.6, 7.4, -7, -3], [6.6, 8.6, -2.6, -0.6]]} />
      {th.fireflies && <Fireflies count={80} area={[20, 15]} center={[0, -1]} />}
      {th.rain && <Rain
        count={340}
        area={[34, 28]}
        center={[0, -1]}
        height={14}
        exclude={[
          [-10.2, -0.8, -5.0, -2.35, 3.1],
          [-10.2, -0.8, -12, -5, 5.4],
        ]}
      />}
    </group>
  )
}
