import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../lib/store'
import { playSpot } from '../lib/actions'
import { getTex } from '../lib/textures'

function M({ c, rough = 0.95, map }) {
  return <meshStandardMaterial color={c} roughness={rough} map={map || null} />
}
function S({ p, r, sc, c, rot, map }) {
  return (
    <mesh position={p} scale={sc} rotation={rot} castShadow receiveShadow>
      <sphereGeometry args={[r, 20, 14]} />
      <M c={c} map={map} />
    </mesh>
  )
}

const clickable = (fn) => ({
  onClick: (e) => {
    e.stopPropagation()
    if (e.delta > 8) return
    fn()
  },
  onPointerOver: () => (document.body.style.cursor = 'pointer'),
  onPointerOut: () => (document.body.style.cursor = ''),
})

// =============================================================
//  백구 (둥글둥글한 진돗개)
// =============================================================
export function Baekgu({ position, rotation = 0 }) {
  const fxT = useStore((s) => s.fx.dog || 0)
  const fur = useMemo(() => getTex('furWhite', 2, 2), [])
  const root = useRef()
  const head = useRef()
  const tail = useRef()
  const W = '#f7f2e8'
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const since = (performance.now() - fxT) / 1000
    const excited = fxT && since < 1.6
    if (tail.current) tail.current.rotation.y = Math.sin(t * (excited ? 22 : 7)) * (excited ? 0.6 : 0.35)
    if (head.current) {
      head.current.rotation.z = excited ? Math.sin(t * 10) * 0.08 : Math.sin(t * 0.8) * 0.15
      head.current.rotation.x = excited ? -0.2 + Math.abs(Math.sin(since * 9)) * -0.15 : Math.sin(t * 0.6) * 0.05
    }
    if (root.current) root.current.position.y = excited ? Math.abs(Math.sin(since * 6)) * 0.12 : 0
  })
  return (
    <group position={position} rotation={[0, rotation, 0]} {...clickable(() => playSpot('dog'))}>
      <group ref={root}>
        {/* 앉은 몸통 */}
        <S p={[0, 0.36, -0.05]} r={1} sc={[0.3, 0.36, 0.32]} c={W} map={fur} />
        <S p={[0, 0.42, 0.12]} r={1} sc={[0.22, 0.24, 0.2]} c="#fffaf0" map={fur} />
        {/* 엉덩이/뒷다리 */}
        {[-1, 1].map((s) => (
          <S key={s} p={[s * 0.2, 0.16, -0.08]} r={1} sc={[0.13, 0.15, 0.2]} c={W} map={fur} />
        ))}
        {/* 앞다리 */}
        {[-1, 1].map((s) => (
          <group key={'f' + s}>
            <mesh position={[s * 0.1, 0.14, 0.17]} castShadow>
              <capsuleGeometry args={[0.055, 0.16, 6, 10]} />
              <M c={W} />
            </mesh>
            <S p={[s * 0.1, 0.04, 0.22]} r={1} sc={[0.065, 0.045, 0.08]} c={W} />
          </group>
        ))}
        {/* 꼬리 (말린 꼬리) */}
        <group ref={tail} position={[0, 0.35, -0.33]}>
          <mesh position={[0, 0.12, -0.04]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.1, 0.055, 10, 18, Math.PI * 1.5]} />
            <M c={W} />
          </mesh>
        </group>
        {/* 머리 */}
        <group ref={head} position={[0, 0.72, 0.1]}>
          <S p={[0, 0, 0]} r={0.23} c={W} map={fur} />
          <S p={[0, -0.06, 0.18]} r={1} sc={[0.11, 0.085, 0.11]} c="#fffaf2" />
          <S p={[0, -0.03, 0.285]} r={0.032} c="#2a1f1a" />
          {[-1, 1].map((s) => (
            <group key={s}>
              <S p={[s * 0.085, 0.04, 0.195]} r={0.026} c="#2a1f1a" />
              <S p={[s * 0.077, 0.05, 0.215]} r={0.008} c="#ffffff" />
              <S p={[s * 0.15, -0.04, 0.15]} r={1} sc={[0.045, 0.025, 0.02]} c="#ffb3b3" />
              <mesh position={[s * 0.13, 0.2, -0.02]} rotation={[0, 0, -s * 0.35]} castShadow>
                <coneGeometry args={[0.07, 0.15, 10]} />
                <M c={W} />
              </mesh>
              <mesh position={[s * 0.13, 0.19, 0.005]} rotation={[0.1, 0, -s * 0.35]}>
                <coneGeometry args={[0.04, 0.1, 8]} />
                <M c="#ffc9c0" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.12, 0.2]} rotation={[0.3, 0, 0]}>
            <sphereGeometry args={[0.03, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c="#f08a8a" />
          </mesh>
        </group>
        {/* 빨간 목걸이 */}
        <mesh position={[0, 0.56, 0.08]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
          <torusGeometry args={[0.15, 0.025, 8, 20]} />
          <M c="#d2453b" rough={0.6} />
        </mesh>
        <S p={[0, 0.5, 0.22]} r={0.03} c="#f2c14e" />
      </group>
    </group>
  )
}

// =============================================================
//  다람쥐 (감나무 가지 위)
// =============================================================
export function Squirrel({ position, rotation = 0 }) {
  const fxT = useStore((s) => s.fx.squirrel || 0)
  const root = useRef()
  const tail = useRef()
  const hands = useRef()
  const B = '#a86a3c'
  const L = '#f3dcc0'
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const since = (performance.now() - fxT) / 1000
    const excited = fxT && since < 2
    if (root.current) root.current.position.y = excited ? Math.abs(Math.sin(since * 9)) * 0.1 : 0
    if (tail.current) tail.current.rotation.x = Math.sin(t * (excited ? 14 : 2)) * (excited ? 0.25 : 0.08)
    if (hands.current) hands.current.position.y = 0.2 + Math.abs(Math.sin(t * 6)) * 0.015
  })
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={1.15} {...clickable(() => playSpot('squirrel'))}>
      <group ref={root}>
        <S p={[0, 0.13, 0]} r={1} sc={[0.1, 0.13, 0.1]} c={B} />
        <S p={[0, 0.13, 0.05]} r={1} sc={[0.07, 0.1, 0.06]} c={L} />
        <S p={[0, 0.29, 0.02]} r={0.085} c={B} />
        <S p={[0, 0.27, 0.085]} r={1} sc={[0.04, 0.03, 0.03]} c={L} />
        <S p={[0, 0.28, 0.115]} r={0.012} c="#2b1d16" />
        {[-1, 1].map((s) => (
          <group key={s}>
            <S p={[s * 0.035, 0.31, 0.08]} r={0.014} c="#1d1410" />
            <S p={[s * 0.06, 0.37, -0.005]} r={1} sc={[0.022, 0.038, 0.014]} c={B} />
            <S p={[s * 0.055, 0.26, 0.075]} r={1} sc={[0.018, 0.012, 0.008]} c="#ffaaa5" />
            <S p={[s * 0.06, 0.02, 0.04]} r={1} sc={[0.03, 0.02, 0.05]} c={B} />
          </group>
        ))}
        <group ref={hands}>
          <S p={[0.025, 0.2, 0.1]} r={0.02} c={B} />
          <S p={[-0.025, 0.2, 0.1]} r={0.02} c={B} />
          <S p={[0, 0.2, 0.125]} r={1} sc={[0.03, 0.035, 0.03]} c="#7a4a26" />
          <S p={[0, 0.225, 0.125]} r={1} sc={[0.032, 0.016, 0.032]} c="#4e2f18" />
        </group>
        <group ref={tail} position={[0, 0.08, -0.08]}>
          {[
            [0, 0.04, -0.05, 0.07],
            [0, 0.13, -0.1, 0.085],
            [0, 0.24, -0.11, 0.09],
            [0, 0.34, -0.07, 0.085],
            [0, 0.4, 0.0, 0.07],
          ].map(([x, y, z, r], i) => (
            <S key={i} p={[x, y, z]} r={r} c={i % 2 ? '#b97a49' : B} />
          ))}
        </group>
      </group>
    </group>
  )
}

// =============================================================
//  고양이 인형 (아지트)
// =============================================================
export function CatPlush({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <S p={[0, 0.1, -0.04]} r={1} sc={[0.16, 0.1, 0.18]} c="#fbf6ee" />
      <S p={[0.05, 0.13, -0.08]} r={1} sc={[0.09, 0.06, 0.1]} c="#d9a16a" />
      <S p={[0, 0.16, 0.12]} r={0.12} c="#fbf6ee" />
      <S p={[-0.05, 0.22, 0.1]} r={1} sc={[0.06, 0.05, 0.05]} c="#d9a16a" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.07, 0.27, 0.11]} rotation={[0, 0, -s * 0.4]}>
            <coneGeometry args={[0.04, 0.07, 8]} />
            <M c={s > 0 ? '#fbf6ee' : '#d9a16a'} />
          </mesh>
          <mesh position={[s * 0.045, 0.17, 0.225]}>
            <torusGeometry args={[0.014, 0.004, 6, 10, Math.PI]} />
            <M c="#3a2a22" />
          </mesh>
          <S p={[s * 0.07, 0.13, 0.21]} r={1} sc={[0.025, 0.015, 0.01]} c="#ffb5b5" />
        </group>
      ))}
      <mesh position={[-0.14, 0.06, -0.12]} rotation={[0, 0.4, Math.PI / 2]}>
        <torusGeometry args={[0.08, 0.025, 8, 14, Math.PI]} />
        <M c="#d9a16a" />
      </mesh>
    </group>
  )
}

export function Persimmon({ p, s = 1 }) {
  return (
    <group position={p} scale={s}>
      <mesh castShadow scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.07, 14, 10]} />
        <meshStandardMaterial color="#f08a24" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.015, 6]} />
        <meshStandardMaterial color="#4f6b2c" />
      </mesh>
    </group>
  )
}

