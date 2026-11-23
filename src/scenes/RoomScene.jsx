import React, { useMemo } from 'react'
import { Box, RBox, Cyl, Sph, Solid, RoomShell, Window, Door, Plant } from '../components/Prims'
import { CatPlush } from '../components/Animals'
import { Brother } from '../components/Family'
import { FairyLights, FlickerLight, Screen } from '../components/Effects'
import { getTex, rng } from '../lib/textures'
import { playSpot } from '../lib/actions'
import { useStore } from '../lib/store'

// =============================================================
//  [내 방 아지트] — 6 × 5 m 의 작은 방, 천장 4 m
//  책상 아래가 꼬마전구가 반짝이는 아지트 (책상 높이 1.25 m 라 서서도 쏙 들어감)
// =============================================================
const W = 6
const D = 5
const H = 4.0

const BOOK_COLORS = ['#c95a4a', '#e8c25a', '#7f9bbd', '#6f9a5a', '#e9dcc8', '#8a5a7a', '#d98f5a', '#4f6b8a', '#f2e2c0']

function Books({ p, width, h = 0.26, seed = 1, rot = 0 }) {
  const books = useMemo(() => {
    const r = rng(seed)
    const arr = []
    let x = 0
    while (x < width - 0.05) {
      const t = 0.035 + r() * 0.04
      const bh = h * (0.75 + r() * 0.25)
      arr.push([x + t / 2, bh, t, BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)]])
      x += t + 0.004
    }
    return arr
  }, [width, h, seed])
  return (
    <group position={p} rotation={[0, rot, 0]}>
      {books.map(([x, bh, t, c], i) => (
        <Box key={i} p={[x - width / 2, bh / 2, 0]} s={[t, bh, 0.18]} c={c} rough={0.8} />
      ))}
    </group>
  )
}

function Desk() {
  const wood = getTex('woodLight', 2, 1)
  const map = useMemo(() => getTex('landscape2'), [])
  const legs = [
    [-0.75, -2.4],
    [1.55, -2.4],
    [-0.75, -1.6],
    [1.55, -1.6],
  ]
  return (
    <group>
      <Box p={[0.4, 1.25, -2.0]} s={[2.5, 0.08, 0.95]} c="#a87a50" map={wood} />
      <Box p={[0.4, 1.17, -1.56]} s={[2.4, 0.1, 0.04]} c="#8a6040" />
      {legs.map(([x, z]) => (
        <group key={x + '' + z}>
          <Box p={[x, 0.61, z]} s={[0.09, 1.22, 0.09]} c="#8a6040" />
          <Solid x={x} z={z} w={0.12} d={0.12} />
        </group>
      ))}
      {/* 모니터 */}
      <Box p={[0.55, 1.33, -2.25]} s={[0.3, 0.04, 0.2]} c="#2a2a2a" />
      <Box p={[0.55, 1.45, -2.28]} s={[0.05, 0.22, 0.05]} c="#2a2a2a" />
      <Box p={[0.55, 1.78, -2.3]} s={[1.0, 0.6, 0.05]} c="#1d1b1a" rough={0.4} />
      <Screen p={[0.55, 1.78, -2.272]} w={0.92} h={0.52} map={map} />
      {/* 키보드, 마우스 */}
      <Box p={[0.5, 1.305, -1.85]} s={[0.6, 0.025, 0.18]} c="#f2efe8" />
      <Sph p={[0.98, 1.305, -1.85]} rad={0.04} sc={[1, 0.5, 1.4]} c="#f2efe8" />
      {/* 스피커 */}
      <RBox p={[1.2, 1.42, -2.3]} s={[0.14, 0.26, 0.14]} c="#3a3330" rad={0.02} />
      {/* 서랍 상자 */}
      <Box p={[-0.15, 1.38, -2.25]} s={[0.4, 0.18, 0.3]} c="#d9c3a0" />
      <Box p={[-0.15, 1.38, -2.095]} s={[0.04, 0.03, 0.01]} c="#5a3d2a" />
      {/* 연필꽂이 */}
      <Cyl p={[-0.5, 1.37, -1.95]} args={[0.06, 0.06, 0.16, 14]} c="#fbf7ee" />
      {['#e36b6b', '#e8c25a', '#7f9bbd'].map((c, i) => (
        <Cyl key={c} p={[-0.52 + i * 0.02, 1.48, -1.95 + (i - 1) * 0.02]} args={[0.008, 0.008, 0.18, 6]} r={[0.1 * (i - 1), 0, 0.12 * (i - 1)]} c={c} />
      ))}
      {/* 책상 스탠드 */}
      <group position={[-0.5, 1.29, -2.3]}>
        <Cyl p={[0, 0.02, 0]} args={[0.12, 0.13, 0.04, 16]} c="#3d3a36" />
        <Cyl p={[0.08, 0.25, 0]} args={[0.015, 0.015, 0.5, 8]} r={[0, 0, -0.35]} c="#3d3a36" />
        <Cyl p={[0.25, 0.53, 0.05]} args={[0.015, 0.015, 0.4, 8]} r={[0.3, 0, 0.9]} c="#3d3a36" />
        <mesh position={[0.42, 0.6, 0.15]} rotation={[0.6, 0, -0.8]}>
          <coneGeometry args={[0.13, 0.18, 18, 1, true]} />
          <meshStandardMaterial color="#3d3a36" side={2} />
        </mesh>
        <Sph p={[0.39, 0.56, 0.17]} rad={0.05} c="#fff2c8" emissive="#ffd27a" ei={4} />
        <pointLight position={[0.38, 0.5, 0.2]} color="#ffc878" intensity={2.6} distance={4} decay={1.4} castShadow={false} />
      </group>
      {/* 책 더미 */}
      <Books p={[1.42, 1.29, -2.28]} width={0.25} h={0.28} seed={4} />
    </group>
  )
}

function Hideout() {
  const mat = useMemo(() => getTex('plaidBrown', 2, 1), [])
  const cushion = useMemo(() => getTex('plaidRed', 1, 1), [])
  return (
    <group>
      {/* 체크 매트 */}
      <RBox p={[0.4, 0.03, -1.95]} s={[2.2, 0.06, 0.95]} c="#ffffff" map={mat} rad={0.025} />
      {/* 등 뒤 쿠션 */}
      <RBox p={[-0.25, 0.27, -2.32]} s={[0.6, 0.45, 0.2]} r={[-0.15, 0.15, 0]} c="#ffffff" map={cushion} rad={0.09} />
      <RBox p={[0.95, 0.25, -2.33]} s={[0.55, 0.42, 0.2]} r={[-0.15, -0.1, 0]} c="#efe6d6" rad={0.09} />
      <Solid x={0.35} z={-2.33} w={1.9} d={0.24} />
      {/* 꼬마전구 줄 */}
      <FairyLights from={[-0.72, 1.19, -1.58]} to={[1.52, 1.19, -1.58]} n={16} sag={0.05} />
      <FairyLights from={[-0.72, 1.19, -2.38]} to={[1.52, 1.19, -2.38]} n={12} sag={0.12} color="#ffe2a8" />
      <pointLight position={[0.4, 0.75, -1.95]} color="#ffbf6a" intensity={1.8} distance={3.2} decay={1.5} />
      {/* 랜턴 */}
      <group position={[1.42, 0, -1.78]}>
        <Box p={[0, 0.03, 0]} s={[0.2, 0.06, 0.2]} c="#3a2e27" />
        <Box p={[0, 0.2, 0]} s={[0.16, 0.28, 0.16]} c="#ffd58a" emissive="#ffae47" ei={1.6} opacity={0.9} />
        <Box p={[0, 0.37, 0]} s={[0.22, 0.05, 0.22]} c="#3a2e27" />
        <mesh position={[0, 0.43, 0]}>
          <torusGeometry args={[0.05, 0.01, 6, 14]} />
          <meshStandardMaterial color="#3a2e27" />
        </mesh>
        <FlickerLight p={[0, 0.25, 0.05]} color="#ffb04a" intensity={1.3} distance={2.5} speed={0.6} />
      </group>
      <Solid x={1.42} z={-1.78} r={0.14} />
      {/* 고양이 인형 */}
      <CatPlush position={[1.05, 0.06, -2.05]} rotation={-0.4} />
      <Solid x={1.05} z={-2.05} r={0.15} />
      {/* 장난감 블록 */}
      {[
        [-0.5, -1.72, '#f2a6c0', 0],
        [-0.38, -1.66, '#a6d8e8', 0.4],
        [-0.44, -1.69, '#fff1a8', 0.2, 0.1],
        [-0.6, -1.62, '#b8e6b0', 0.8],
      ].map(([x, z, c, ry, y = 0], i) => (
        <RBox key={i} p={[x, 0.11 + y, z]} s={[0.09, 0.09, 0.09]} r={[0, ry, 0]} c={c} rad={0.015} />
      ))}
      <Solid x={-0.48} z={-1.68} r={0.13} />
      {/* 뽁뽁이 */}
      <Box p={[0.05, 0.08, -2.0]} s={[0.4, 0.03, 0.32]} r={[0, 0.3, 0]} c="#e8f2f6" rough={0.15} opacity={0.6} />
    </group>
  )
}

function Sketchbook() {
  const fxT = useStore((s) => s.fx.pencil || 0)
  const map = useMemo(() => getTex('sketch'), [])
  const active = fxT && performance.now() - fxT < 2500
  return (
    <group position={[1.0, 0.065, -1.45]} rotation={[0, -0.25, 0]} onClick={(e) => (e.stopPropagation(), e.delta < 8 && playSpot('pencil'))}>
      <Box p={[0, 0.005, 0]} s={[0.46, 0.012, 0.34]} c="#5a4a3a" />
      <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.43, 0.32]} />
        <meshStandardMaterial map={map} roughness={1} />
      </mesh>
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[-0.2 + i * 0.057, 0.015, -0.17]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.012, 0.003, 4, 8]} />
          <meshStandardMaterial color="#888" metalness={0.6} />
        </mesh>
      ))}
      <group position={[0.1, 0.025, 0.06]} rotation={[0, active ? 0.4 + Math.sin(performance.now() * 0.02) * 0.3 : 0.6, 0]}>
        <Cyl p={[0, 0, 0]} args={[0.009, 0.009, 0.2, 6]} r={[0, 0, Math.PI / 2]} c="#f2c14e" />
        <mesh position={[0.11, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.009, 0.025, 6]} />
          <meshStandardMaterial color="#e8cfa8" />
        </mesh>
      </group>
    </group>
  )
}

function Bed() {
  const blanket = useMemo(() => getTex('plaidBlue', 2, 2), [])
  return (
    <group position={[-2.25, 0, 0.2]}>
      <RBox p={[0, 0.18, 0]} s={[1.4, 0.36, 2.2]} c="#a87a50" rad={0.04} map={getTex('woodLight', 1, 1)} />
      <RBox p={[0, 0.47, 0]} s={[1.32, 0.24, 2.1]} c="#fbf7ef" rad={0.08} />
      <RBox p={[0, 0.62, 0.35]} s={[1.38, 0.12, 1.45]} c="#ffffff" map={blanket} rad={0.06} />
      <RBox p={[0, 0.65, -0.75]} s={[0.9, 0.16, 0.42]} c="#f6efe2" rad={0.08} />
      <RBox p={[0, 0.65, -1.08]} s={[1.4, 1.0, 0.1]} c="#8e6242" rad={0.04} />
      <Sph p={[0.35, 0.72, -0.5]} rad={0.13} c="#e8c25a" />
      <Sph p={[0.35, 0.86, -0.5]} rad={0.08} c="#e8c25a" />
    </group>
  )
}

function Bookshelf() {
  return (
    <group position={[-2.3, 0, -2.25]}>
      <Box p={[0, 1.1, -0.15]} s={[1.2, 2.2, 0.04]} c="#7a5236" />
      {[-0.58, 0.58].map((x) => (
        <Box key={x} p={[x, 1.1, 0]} s={[0.04, 2.2, 0.36]} c="#8a6040" />
      ))}
      {[0.02, 0.55, 1.1, 1.65, 2.18].map((y) => (
        <Box key={y} p={[0, y, 0]} s={[1.2, 0.04, 0.36]} c="#8a6040" />
      ))}
      <Books p={[-0.1, 0.04, 0]} width={0.95} seed={2} h={0.42} />
      <Books p={[-0.25, 0.57, 0]} width={0.62} seed={3} h={0.4} />
      <RBox p={[0.32, 0.72, 0.02]} s={[0.4, 0.28, 0.3]} c="#b08850" map={getTex('wicker', 1, 1)} rad={0.03} />
      <Books p={[0.1, 1.12, 0]} width={0.9} seed={5} h={0.38} />
      <RBox p={[-0.3, 1.78, 0.02]} s={[0.42, 0.22, 0.3]} c="#d9c3a0" rad={0.03} />
      <Books p={[0.25, 1.67, 0]} width={0.45} seed={6} h={0.36} />
      <Plant p={[0.25, 2.2, 0]} s={0.55} leaf="#6a9a4a" />
      {/* 늘어진 아이비 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Sph key={i} p={[0.42 + Math.sin(i) * 0.04, 2.12 - i * 0.18, 0.17]} rad={0.06} c="#5f8f45" seg={8} />
      ))}
      {/* 종이 등 */}
      <Box p={[-0.3, 1.32, 0.02]} s={[0.24, 0.36, 0.24]} c="#ffe8b8" emissive="#ffbf6a" ei={1.2} />
      <pointLight position={[-0.3, 1.32, 0.2]} color="#ffc070" intensity={0.8} distance={2.5} />
    </group>
  )
}

export default function RoomScene() {
  const rug = useMemo(() => getTex('furWhite', 3, 3), [])
  return (
    <group>
      <color attach="background" args={['#1f1611']} />
      <ambientLight intensity={0.28} color="#ffdcb0" />
      <hemisphereLight args={['#ffe8c8', '#6a4a35', 0.4]} />
      <directionalLight
        position={[2, 6.5, -7]}
        intensity={1.0}
        color="#ffd49a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <pointLight position={[0, H - 0.6, 0.5]} color="#ffdcae" intensity={1.4} distance={7} decay={1.4} />

      <RoomShell w={W} d={D} h={H} floorTex="woodDark" beams={2} />
      <Window p={[0.4, 2.65, -2.48]} w={1.6} h={1.1} view="sunset" glow={1.05} />
      <Door p={[2.97, 0, 0.8]} rotY={-Math.PI / 2} to="living" label="🛋️ 거실로" color="#f2cf4a" frame="#d6a82a" w={0.95} />

      {/* 폭신한 러그 */}
      <mesh position={[0.3, 0.008, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.25, 40]} />
        <meshStandardMaterial map={rug} color="#f5ede0" roughness={1} />
      </mesh>

      <Desk />
      <Hideout />
      <Sketchbook />
      <Bed />
      <Solid x={-2.25} z={0.2} w={1.45} d={2.25} />
      <Bookshelf />
      <Solid x={-2.3} z={-2.25} w={1.22} d={0.42} />

      {/* 오른쪽 벽: 바구니, 화분, 수납함 */}
      <RBox p={[2.55, 0.22, -2.05]} s={[0.6, 0.44, 0.5]} c="#b08850" map={getTex('wicker', 2, 1)} rad={0.04} />
      <Books p={[2.55, 0.44, -2.05]} width={0.45} h={0.2} seed={8} />
      <Solid x={2.55} z={-2.05} w={0.62} d={0.52} />
      <Plant p={[2.55, 0, -1.25]} s={1.3} leaf="#5f8f45" />
      <Solid x={2.55} z={-1.25} r={0.28} />
      <RBox p={[2.6, 0.2, 2.05]} s={[0.55, 0.4, 0.5]} c="#e9dcc8" rad={0.04} />
      <RBox p={[2.6, 0.55, 2.05]} s={[0.5, 0.3, 0.45]} c="#c9d6e2" rad={0.04} />
      <Solid x={2.6} z={2.05} w={0.58} d={0.52} />

      {/* 벽 장식: 사진 줄 */}
      <FairyLights from={[-2.9, 2.6, -1.2]} to={[-2.9, 2.6, 1.4]} n={10} sag={0.15} />
      {[-0.8, -0.1, 0.6].map((z, i) => (
        <group key={z} position={[-2.96, 2.25, z]} rotation={[0, Math.PI / 2, (i - 1) * 0.1]}>
          <Box s={[0.32, 0.38, 0.01]} c="#fbf7ef" />
          <mesh position={[0, 0.03, 0.006]}>
            <planeGeometry args={[0.26, 0.24]} />
            <meshBasicMaterial map={getTex(i === 1 ? 'sunset' : 'landscape')} />
          </mesh>
        </group>
      ))}

      {/* 오빠의 빈백 + 오빠 */}
      <mesh position={[-2.25, 0.2, 1.95]} scale={[1, 0.55, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 24, 16]} />
        <meshStandardMaterial color="#d9a441" roughness={1} />
      </mesh>
      <Solid x={-2.25} z={1.95} r={0.52} />
      <Brother position={[-2.25, 0.5, 1.95]} heading={1.15} />
    </group>
  )
}
