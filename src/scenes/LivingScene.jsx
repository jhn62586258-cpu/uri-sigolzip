import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, RBox, Cyl, Sph, Solid, RoomShell, Window, Door, Plant } from '../components/Prims'
import { Persimmon } from '../components/Animals'
import { Mom, Dad } from '../components/Family'
import { Steam, FlickerLight, Screen } from '../components/Effects'
import { getTex } from '../lib/textures'
import { playSpot } from '../lib/actions'

// =============================================================
//  [거실과 부엌] — 10 × 7 m 의 아담한 공간, 천장 4.4 m
//  x: -5 ~ 5  (왼쪽 거실 / 오른쪽 부엌),  z: -3.5 ~ 3.5
// =============================================================
const W = 10
const D = 7
const H = 4.4

function Sofa() {
  const c = '#cbbfae'
  return (
    <group position={[-2.0, 0, 0.4]}>
      <RBox p={[0, 0.2, 0]} s={[2.0, 0.4, 0.85]} c={c} rad={0.08} />
      <RBox p={[0, 0.65, 0.33]} s={[2.0, 0.6, 0.22]} c={c} rad={0.1} />
      {[-1, 1].map((s) => (
        <RBox key={s} p={[s * 0.95, 0.38, 0]} s={[0.22, 0.56, 0.85]} c={c} rad={0.1} />
      ))}
      {[-0.43, 0.43].map((x) => (
        <RBox key={x} p={[x, 0.46, -0.05]} s={[0.82, 0.14, 0.7]} c="#d6cbbb" rad={0.06} />
      ))}
      <RBox p={[0.65, 0.68, 0.12]} s={[0.4, 0.36, 0.12]} r={[-0.2, 0.2, 0.1]} c="#a33a32" map={getTex('plaidRed', 1, 1)} rad={0.05} />
      <RBox p={[-0.7, 0.66, 0.12]} s={[0.38, 0.34, 0.12]} r={[-0.2, -0.2, -0.1]} c="#e8c25a" rad={0.05} />
      {[[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]].map(([x, z]) => (
        <Cyl key={x + '' + z} p={[x, 0.03, z]} args={[0.04, 0.03, 0.06, 8]} c="#5a3d2a" />
      ))}
    </group>
  )
}

function TvSet() {
  const map = useMemo(() => getTex('landscape2'), [])
  return (
    <group position={[-2.0, 0, -3.15]}>
      <Box p={[0, 0.28, 0]} s={[2.0, 0.56, 0.5]} c="#7a5236" map={getTex('woodDark', 1, 0.5)} />
      {[-0.5, 0.5].map((x) => (
        <Box key={x} p={[x, 0.28, 0.255]} s={[0.92, 0.46, 0.01]} c="#8e6242" />
      ))}
      <Box p={[0, 0.6, 0.0]} s={[0.35, 0.05, 0.22]} c="#222" />
      <Box p={[0, 1.02, -0.02]} s={[1.3, 0.78, 0.07]} c="#1d1b1a" rough={0.4} />
      <Screen p={[0, 1.02, 0.017]} w={1.2} h={0.68} map={map} />
      {/* 라디오, 화분, 액자 */}
      <RBox p={[0.75, 0.68, 0.05]} s={[0.36, 0.22, 0.14]} c="#c96b4a" rad={0.03} />
      <Sph p={[0.69, 0.68, 0.125]} rad={0.05} c="#3a2e27" />
      <Plant p={[-0.75, 0.56, 0.05]} s={0.42} />
    </group>
  )
}

function WoodStove() {
  const flame = useRef()
  useFrame((s) => {
    if (flame.current) flame.current.emissiveIntensity = 2.2 + Math.sin(s.clock.elapsedTime * 11) * 0.5 + Math.random() * 0.4
  })
  return (
    <group position={[0.6, 0, -3.05]}>
      {[[-0.28, -0.2], [0.28, -0.2], [-0.28, 0.2], [0.28, 0.2]].map(([x, z]) => (
        <Box key={x + '' + z} p={[x, 0.08, z]} s={[0.06, 0.16, 0.06]} c="#1e1c1b" />
      ))}
      <RBox p={[0, 0.48, 0]} s={[0.72, 0.64, 0.56]} c="#2b2826" rad={0.04} rough={0.6} />
      <Box p={[0, 0.46, 0.285]} s={[0.46, 0.34, 0.02]} c="#2e1a10" />
      <mesh position={[0, 0.45, 0.29]}>
        <planeGeometry args={[0.4, 0.28]} />
        <meshStandardMaterial ref={flame} color="#ff8a2a" emissive="#ff6a1a" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <Box p={[0, 0.82, 0]} s={[0.78, 0.04, 0.6]} c="#1c1a19" />
      <Cyl p={[0, 2.6, -0.1]} args={[0.08, 0.08, 3.6, 12]} c="#1f1d1c" metal={0.4} rough={0.5} />
      {/* 금색 주전자 */}
      <group position={[0, 0.84, 0.02]} onClick={(e) => (e.stopPropagation(), e.delta < 8 && playSpot('kettle'))}>
        <mesh position={[0, 0.13, 0]} scale={[1, 0.8, 1]} castShadow>
          <sphereGeometry args={[0.17, 20, 14]} />
          <meshStandardMaterial color="#d2a845" metalness={0.75} roughness={0.28} />
        </mesh>
        <Cyl p={[0, 0.27, 0]} args={[0.06, 0.08, 0.04, 14]} c="#c79a3a" metal={0.7} rough={0.3} />
        <Sph p={[0, 0.31, 0]} rad={0.025} c="#3a2a1f" />
        <Cyl p={[0.18, 0.17, 0]} args={[0.018, 0.035, 0.2, 8]} r={[0, 0, -0.9]} c="#d2a845" metal={0.75} rough={0.28} />
        <mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.13, 0.012, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#2b2218" />
        </mesh>
      </group>
      <Steam p={[0.27, 1.1, 0.02]} n={2} scale={0.8} fxKey="kettle" />
    </group>
  )
}

function Kitchen() {
  const tile = useMemo(() => getTex('tile', 6, 2), [])
  return (
    <group>
      {/* 냉장고 */}
      <RBox p={[1.35, 0.85, -3.12]} s={[0.72, 1.7, 0.66]} c="#f3f1ec" rad={0.05} rough={0.4} />
      <Box p={[1.35, 1.1, -2.785]} s={[0.7, 0.01, 0.01]} c="#cfcac0" />
      <Box p={[1.62, 1.35, -2.77]} s={[0.03, 0.3, 0.03]} c="#b7b0a2" metal={0.4} />
      <Box p={[1.62, 0.75, -2.77]} s={[0.03, 0.25, 0.03]} c="#b7b0a2" metal={0.4} />
      {[['#f2c14e', 1.25, 1.45], ['#e36b6b', 1.42, 1.3], ['#7fb0d8', 1.18, 1.25]].map(([c, x, y], i) => (
        <Box key={i} p={[x, y, -2.78]} s={[0.08, 0.08, 0.01]} c={c} />
      ))}
      {/* 하부장 + 상판 */}
      <RBox p={[3.4, 0.43, -3.2]} s={[3.0, 0.86, 0.6]} c="#9b6b45" rad={0.03} map={getTex('woodLight', 2, 1)} />
      {[2.15, 2.9, 3.65, 4.4].map((x) => (
        <group key={x}>
          <Box p={[x, 0.43, -2.895]} s={[0.7, 0.72, 0.01]} c="#a57650" />
          <Box p={[x + 0.25, 0.6, -2.88]} s={[0.04, 0.12, 0.02]} c="#3a2e27" />
        </group>
      ))}
      <Box p={[3.4, 0.88, -3.18]} s={[3.04, 0.05, 0.66]} c="#e8e2d6" rough={0.4} />
      {/* 타일 */}
      <mesh position={[3.4, 1.4, -3.49]}>
        <planeGeometry args={[3.0, 1.0]} />
        <meshStandardMaterial map={tile} roughness={0.35} />
      </mesh>
      {/* 개수대 */}
      <Box p={[4.3, 0.88, -3.15]} s={[0.6, 0.06, 0.4]} c="#9aa3a8" metal={0.6} rough={0.3} />
      <Cyl p={[4.3, 1.05, -3.4]} args={[0.02, 0.02, 0.3, 8]} c="#c0c6c9" metal={0.8} rough={0.2} />
      <Cyl p={[4.3, 1.2, -3.32]} args={[0.018, 0.018, 0.18, 8]} r={[Math.PI / 2, 0, 0]} c="#c0c6c9" metal={0.8} rough={0.2} />
      {/* 가스레인지 + 찌개 뚝배기 */}
      <Box p={[3.1, 0.92, -3.15]} s={[0.6, 0.04, 0.45]} c="#2a2a2a" rough={0.5} />
      <Cyl p={[3.1, 1.02, -3.1]} args={[0.2, 0.15, 0.17, 18]} c="#4a2a20" rough={0.6} />
      <Cyl p={[3.1, 1.1, -3.1]} args={[0.18, 0.18, 0.01, 18]} c="#b8432a" emissive="#7a1d0a" ei={0.3} />
      <Steam p={[3.1, 1.12, -3.1]} n={6} />
      <pointLight position={[3.1, 0.98, -3.1]} color="#ff6a2a" intensity={0.5} distance={1.2} />
      {/* 레인지 후드 */}
      <Box p={[3.1, 2.15, -3.25]} s={[0.8, 0.25, 0.5]} c="#d8d4cc" metal={0.3} rough={0.4} />
      <Box p={[3.1, 2.9, -3.35]} s={[0.3, 1.25, 0.3]} c="#d8d4cc" metal={0.3} rough={0.4} />
      {/* 상부장 */}
      {[2.15, 4.25].map((x) => (
        <group key={x}>
          <RBox p={[x, 2.35, -3.3]} s={[1.1, 0.8, 0.38]} c="#9b6b45" rad={0.02} />
          <Box p={[x, 2.35, -3.105]} s={[0.02, 0.72, 0.01]} c="#7a5236" />
        </group>
      ))}
      {/* 선반 + 양념통 */}
      <Box p={[2.15, 1.62, -3.38]} s={[1.0, 0.04, 0.22]} c="#7a5236" />
      {[['#f6e7c8', 1.8], ['#d9643a', 2.0], ['#7a8a4a', 2.2], ['#f0d080', 2.4]].map(([c, x]) => (
        <group key={x}>
          <Cyl p={[x, 1.72, -3.36]} args={[0.06, 0.06, 0.16, 12]} c="#e8eef0" opacity={0.6} rough={0.1} />
          <Cyl p={[x, 1.7, -3.36]} args={[0.055, 0.055, 0.1, 12]} c={c} />
          <Cyl p={[x, 1.82, -3.36]} args={[0.062, 0.062, 0.03, 12]} c="#a0522d" />
        </group>
      ))}
      {/* 국자, 프라이팬 걸이 */}
      <Cyl p={[3.9, 1.65, -3.45]} args={[0.012, 0.012, 1.0, 6]} r={[0, 0, Math.PI / 2]} c="#7a5236" />
      {[3.6, 3.85, 4.1].map((x) => (
        <group key={x}>
          <Cyl p={[x, 1.5, -3.43]} args={[0.01, 0.01, 0.28, 6]} c="#bfbfbf" metal={0.7} />
          <Sph p={[x, 1.35, -3.42]} rad={0.04} c="#bfbfbf" metal={0.7} rough={0.3} />
        </group>
      ))}
      {/* 걸어둔 마늘, 고추 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Sph key={i} p={[4.85, 2.3 - i * 0.12, -2.4]} rad={0.05} sc={[1, 1.6, 1]} c="#c93a2a" />
      ))}
      <Solid x={1.35} z={-3.12} w={0.74} d={0.7} />
      <Solid x={3.4} z={-3.2} w={3.0} d={0.64} />
    </group>
  )
}

function DiningTable() {
  const wood = getTex('woodLight', 1, 1)
  return (
    <group>
      <group position={[3.0, 0, 0.9]}>
        <Box p={[0, 0.74, 0]} s={[1.4, 0.06, 0.88]} c="#8e5d3b" map={wood} />
        {[[-0.62, -0.36], [0.62, -0.36], [-0.62, 0.36], [0.62, 0.36]].map(([x, z]) => (
          <Box key={x + '' + z} p={[x, 0.36, z]} s={[0.07, 0.72, 0.07]} c="#6e472d" />
        ))}
        <Cyl p={[0, 0.83, 0]} args={[0.22, 0.14, 0.12, 18]} c="#e9e2d4" />
        {[[0, 0.92, 0], [0.09, 0.9, 0.06], [-0.08, 0.9, 0.05], [0.04, 0.9, -0.09], [-0.06, 0.95, -0.03]].map((p, i) => (
          <Persimmon key={i} p={p} s={1.3} />
        ))}
        <Cyl p={[-0.45, 0.8, 0.2]} args={[0.05, 0.04, 0.07, 12]} c="#f4f1ea" />
        <Cyl p={[0.45, 0.8, -0.2]} args={[0.05, 0.04, 0.07, 12]} c="#f4f1ea" />
      </group>
      {[
        [2.62, 0.25, 0],
        [3.38, 0.25, 0],
        [2.62, 1.55, Math.PI],
        [3.38, 1.55, Math.PI],
      ].map(([x, z, ry]) => (
        <group key={x + '' + z} position={[x, 0, z]} rotation={[0, ry, 0]}>
          <Box p={[0, 0.45, 0]} s={[0.42, 0.05, 0.42]} c="#8e5d3b" />
          <Box p={[0, 0.78, -0.19]} s={[0.42, 0.6, 0.04]} c="#7a4f32" />
          {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([lx, lz]) => (
            <Box key={lx + '' + lz} p={[lx, 0.22, lz]} s={[0.04, 0.45, 0.04]} c="#6e472d" />
          ))}
        </group>
      ))}
      <Solid x={3.0} z={0.9} w={1.45} d={0.92} />
      <Solid x={2.62} z={0.2} w={0.44} d={0.44} />
      <Solid x={3.38} z={0.2} w={0.44} d={0.44} />
      <Solid x={2.62} z={1.6} w={0.44} d={0.44} />
      <Solid x={3.38} z={1.6} w={0.44} d={0.44} />
      {/* 펜던트 조명 */}
      <Cyl p={[3.0, 3.75, 0.9]} args={[0.008, 0.008, 1.3, 6]} c="#333" />
      <mesh position={[3.0, 3.05, 0.9]}>
        <coneGeometry args={[0.3, 0.25, 20, 1, true]} />
        <meshStandardMaterial color="#e9dcc5" side={2} emissive="#ffcf8a" emissiveIntensity={0.4} />
      </mesh>
      <Sph p={[3.0, 2.98, 0.9]} rad={0.07} c="#fff2cc" emissive="#ffd27a" ei={3} />
      <pointLight position={[3.0, 2.85, 0.9]} color="#ffcf8a" intensity={3} distance={6} decay={1.4} />
    </group>
  )
}

function WallClock() {
  const hour = useRef()
  const min = useRef()
  useFrame(() => {
    const d = new Date()
    const m = d.getMinutes() + d.getSeconds() / 60
    const h = (d.getHours() % 12) + m / 60
    if (hour.current) hour.current.rotation.z = -(h / 12) * Math.PI * 2
    if (min.current) min.current.rotation.z = -(m / 60) * Math.PI * 2
  })
  return (
    <group position={[-0.3, 2.95, -3.47]}>
      <Cyl args={[0.28, 0.28, 0.06, 28]} r={[Math.PI / 2, 0, 0]} c="#6b4a33" />
      <mesh position={[0, 0, 0.032]}>
        <circleGeometry args={[0.24, 28]} />
        <meshStandardMaterial map={getTex('clock')} />
      </mesh>
      <group ref={hour} position={[0, 0, 0.04]}>
        <Box p={[0, 0.06, 0]} s={[0.025, 0.13, 0.01]} c="#3a2a1f" cast={false} />
      </group>
      <group ref={min} position={[0, 0, 0.045]}>
        <Box p={[0, 0.09, 0]} s={[0.016, 0.19, 0.01]} c="#3a2a1f" cast={false} />
      </group>
    </group>
  )
}

export default function LivingScene() {
  const straw = useMemo(() => getTex('straw', 2, 1.5), [])
  const rugMap = useMemo(() => getTex('plaidBrown', 2, 1.4), [])
  return (
    <group>
      <color attach="background" args={['#241a14']} />
      <ambientLight intensity={0.35} color="#ffe6c8" />
      <hemisphereLight args={['#fff1dc', '#7a5a40', 0.55]} />
      <directionalLight
        position={[-3, 7, 5]}
        intensity={1.15}
        color="#ffe0b0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <FlickerLight p={[0.6, 0.55, -2.55]} intensity={2.2} distance={4.5} />
      {/* 형광등 */}
      <Box p={[-2.0, H - 0.32, -0.6]} s={[1.4, 0.06, 0.16]} c="#fffaf0" emissive="#fff6e0" ei={2} cast={false} />
      <pointLight position={[-2.0, H - 0.6, -0.6]} color="#fff1d8" intensity={2.4} distance={8} decay={1.3} />

      <RoomShell w={W} d={D} h={H} floorTex="wood" />

      {/* 창문들 */}
      <Window p={[-2.0, 2.35, -3.48]} w={1.8} h={1.3} view="landscape" />
      <Window p={[4.97, 2.0, -1.2]} w={1.1} h={1.0} rotY={-Math.PI / 2} view="landscape" curtains={false} />

      {/* 문: 마당(왼쪽 벽), 내 방(오른쪽 벽, 노란 문틀) */}
      <Door p={[-4.97, 0, 2.3]} rotY={Math.PI / 2} to="yard" label="🌳 마당으로" color="#a8b9c0" frame="#5a3d2a" w={1.2} glass />
      <Door p={[4.97, 0, 2.5]} rotY={-Math.PI / 2} to="room" label="🚪 내 방으로" color="#f2cf4a" frame="#d6a82a" w={0.95} />

      {/* 돗자리 + 러그 */}
      <mesh position={[-2.0, 0.006, -1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.6, 2.6]} />
        <meshStandardMaterial map={straw} roughness={1} />
      </mesh>
      <mesh position={[-2.0, 0.012, -1.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.0, 1.3]} />
        <meshStandardMaterial map={rugMap} roughness={1} />
      </mesh>

      <TvSet />
      <Solid x={-2.0} z={-3.15} w={2.0} d={0.52} />
      <Sofa />
      <Solid x={-2.0} z={0.4} w={2.12} d={0.9} />
      <Dad position={[-2.3, 0.45, 0.22]} heading={Math.PI} />

      {/* 좌식 탁자 */}
      <group position={[-2.0, 0, -1.25]}>
        <Box p={[0, 0.34, 0]} s={[1.0, 0.06, 0.6]} c="#7a4f32" map={getTex('woodDark', 1, 1)} />
        {[[-0.44, -0.24], [0.44, -0.24], [-0.44, 0.24], [0.44, 0.24]].map(([x, z]) => (
          <Box key={x + '' + z} p={[x, 0.16, z]} s={[0.06, 0.32, 0.06]} c="#5a3a25" />
        ))}
        <Cyl p={[-0.2, 0.41, 0.05]} args={[0.05, 0.045, 0.09, 12]} c="#f4f1ea" />
        <Cyl p={[-0.05, 0.41, -0.08]} args={[0.05, 0.045, 0.09, 12]} c="#c9e0d8" />
        <Box p={[0.25, 0.38, 0]} s={[0.32, 0.015, 0.24]} r={[0, 0.3, 0]} c="#f1ece0" />
      </group>
      <Solid x={-2.0} z={-1.25} w={1.04} d={0.64} />
      {/* 방석 */}
      <RBox p={[-3.3, 0.05, -1.2]} s={[0.55, 0.1, 0.55]} c="#c95a4a" rad={0.04} />

      {/* 사이드 테이블 + 스탠드 */}
      <group position={[-3.5, 0, 0.6]}>
        <Box p={[0, 0.25, 0]} s={[0.45, 0.5, 0.45]} c="#7a4f32" />
        <Cyl p={[0, 0.6, 0]} args={[0.04, 0.08, 0.2, 10]} c="#c8a26a" />
        <Cyl p={[0, 0.82, 0]} args={[0.13, 0.2, 0.24, 18]} c="#f3e5c8" emissive="#ffd28a" ei={0.6} open />
        <pointLight position={[0, 0.8, 0]} color="#ffc778" intensity={1.4} distance={3} />
      </group>
      <Solid x={-3.5} z={0.6} w={0.48} d={0.48} />

      <WoodStove />
      <Solid x={0.6} z={-3.05} w={0.8} d={0.62} />
      <WallClock />

      {/* 큰 화분들 */}
      <Plant p={[-4.45, 0, -3.0]} s={1.8} />
      <Solid x={-4.45} z={-3.0} r={0.38} />
      <Plant p={[-0.6, 0, -3.1]} s={1.1} flowers="#f2a6c0" />
      <Solid x={-0.6} z={-3.1} r={0.26} />

      {/* 벽 선반 + 액자 */}
      <Box p={[-4.0, 2.0, -3.4]} s={[1.0, 0.04, 0.2]} c="#7a5236" />
      {[['#e8c25a', -4.3], ['#7f9bbd', -4.0], ['#c95a4a', -3.75]].map(([c, x]) => (
        <Box key={x} p={[x, 2.13, -3.38]} s={[0.12, 0.22, 0.14]} c={c} />
      ))}
      <Box p={[-4.96, 2.4, 0.2]} s={[0.04, 0.6, 0.8]} c="#5a3d2a" />
      <mesh position={[-4.93, 2.4, 0.2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshBasicMaterial map={getTex('sunset')} />
      </mesh>

      <Kitchen />
      {/* 엄마가 올라선 작은 나무 발판 */}
      <RBox p={[3.1, 0.12, -2.52]} s={[0.62, 0.24, 0.5]} c="#a57650" rad={0.03} />
      <Mom position={[3.1, 0.24, -2.55]} heading={Math.PI} />
      <DiningTable />
    </group>
  )
}
