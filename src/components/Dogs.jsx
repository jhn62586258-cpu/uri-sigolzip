import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useStore } from '../lib/store'
import { player } from '../lib/shared'
import { addSolid, resolveCollisions } from '../lib/collision'
import { getTex, rng } from '../lib/textures'
import { petDogs, hugPoodle } from '../lib/actions'

const damp = THREE.MathUtils.damp

function M({ c, rough = 0.95, map }) {
  return <meshStandardMaterial color={c} roughness={rough} map={map || null} />
}
function S({ p, r = 1, sc, c, map, rot }) {
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

// ---------- 하트 이펙트 ----------
export function Hearts({ fxKey, y = 1.1 }) {
  const ts = useStore((s) => s.fx[fxKey] || 0)
  const [show, setShow] = useState(0)
  useEffect(() => {
    if (!ts) return
    setShow(ts)
    const id = setTimeout(() => setShow(0), 1900)
    return () => clearTimeout(id)
  }, [ts])
  if (!show) return null
  return (
    <Html position={[0, y, 0]} center zIndexRange={[25, 15]} key={show}>
      <div className="hearts">
        {['💗', '💕', '💖', '🤍', '💗', '💞', '💓'].map((h, i) => (
          <span key={i} style={{ '--x': `${(i - 3) * 16 + (i % 2 ? 6 : -6)}px`, '--d': `${i * 0.08}s` }}>
            {h}
          </span>
        ))}
      </div>
    </Html>
  )
}

// =============================================================
//  마당 강아지 (서서 돌아다니는 시골 강아지)
//  · 평소: 서로 쫓아다니며 놀고, 가끔 엎드려 "놀자!" 자세(플레이 바우)
//  · 주인공이 다가오면: 달려와 꼬리를 세차게 흔들며 깡총깡총 반김
// =============================================================
export function Dog({ start, center, phase = 0, colors, name, playRadius = 1.1 }) {
  const fxT = useStore((s) => s.fx.dogs || 0)
  const furMap = useMemo(() => getTex(colors.fur, 2, 2), [colors.fur])
  const root = useRef()
  const body = useRef()
  const head = useRef()
  const tail = useRef()
  const legs = [useRef(), useRef(), useRef(), useRef()]
  const st = useRef({ pos: new THREE.Vector3(start[0], 0, start[1]), heading: 0, walk: 0, bow: 0, hop: 0 })
  const solid = useMemo(() => ({ type: 'circle', x: start[0], z: start[1], r: 0.36 }), [])
  useLayoutEffect(() => addSolid(solid), [solid])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const t = state.clock.elapsedTime
    const s = st.current
    const toP = new THREE.Vector2(player.pos.x - s.pos.x, player.pos.z - s.pos.z)
    const dp = toP.length()
    const since = (performance.now() - fxT) / 1000
    const excited = fxT && since < 2.2
    const greeting = dp < 3.0

    let tx
    let tz
    let speed = 1.6
    let bowing = false
    if (greeting) {
      // 주인공 앞쪽 양옆으로 자리잡기
      const ang = Math.atan2(s.pos.x - player.pos.x, s.pos.z - player.pos.z) + (phase > 1 ? 0.5 : -0.5)
      tx = player.pos.x + Math.sin(ang) * 0.95
      tz = player.pos.z + Math.cos(ang) * 0.95
      speed = 2.0
    } else {
      const cyc = (t + phase * 3) % 8
      bowing = cyc < 1.4
      const a = t * 0.75 + phase
      tx = center[0] + Math.cos(a) * playRadius
      tz = center[1] + Math.sin(a) * playRadius * 0.7
      if (bowing) {
        tx = s.pos.x
        tz = s.pos.z
      }
    }
    const dx = tx - s.pos.x
    const dz = tz - s.pos.z
    const d = Math.hypot(dx, dz)
    let moving = false
    if (d > 0.08 && !excited) {
      const step = Math.min(d, speed * dt * Math.min(1, d / 0.4))
      s.pos.x += (dx / d) * step
      s.pos.z += (dz / d) * step
      moving = step > 0.002
      s.walk += step * 9
      s.heading = angLerp(s.heading, Math.atan2(dx, dz), Math.min(1, dt * 8))
    } else if (greeting || excited) {
      s.heading = angLerp(s.heading, Math.atan2(toP.x, toP.y), Math.min(1, dt * 6))
    } else if (bowing) {
      // 상대 강아지 쪽을 바라보며 놀자 자세
      s.heading = angLerp(s.heading, Math.atan2(center[0] - s.pos.x, center[1] - s.pos.z), Math.min(1, dt * 4))
    }
    // 주인공과 너무 붙지 않게
    if (dp < 0.7) {
      s.pos.x -= (toP.x / dp) * (0.7 - dp)
      s.pos.z -= (toP.y / dp) * (0.7 - dp)
    }
    resolveCollisions(s.pos, 0.36, solid)
    solid.x = s.pos.x
    solid.z = s.pos.z

    s.bow = damp(s.bow, bowing ? 1 : 0, 6, dt)
    const hop = excited ? Math.abs(Math.sin(since * 9)) * 0.28 : greeting && !moving ? Math.abs(Math.sin(t * 7 + phase)) * 0.07 : 0
    if (root.current) {
      root.current.position.set(s.pos.x, hop, s.pos.z)
      root.current.rotation.y = s.heading + (excited ? Math.sin(since * 12) * 0.25 : 0)
    }
    if (body.current) body.current.rotation.x = s.bow * 0.28
    const swing = moving ? Math.sin(s.walk) * 0.6 : 0
    legs.forEach((l, i) => {
      if (!l.current) return
      const front = i < 2
      l.current.rotation.x = (i % 2 ? swing : -swing) * (front ? 1 : -1) + (front ? -s.bow * 0.9 : 0)
    })
    const wagSpeed = excited ? 26 : greeting ? 20 : 7
    if (tail.current) tail.current.rotation.z = Math.sin(t * wagSpeed) * (greeting || excited ? 0.6 : 0.3)
    if (head.current) {
      head.current.rotation.z = greeting ? Math.sin(t * 2.2 + phase) * 0.18 : Math.sin(t * 0.9 + phase) * 0.08
      head.current.rotation.x = -s.bow * 0.25 + (excited ? -0.2 : 0)
    }
  })

  const C = colors
  return (
    <group ref={root} {...clickable(petDogs)}>
      <group ref={body} position={[0, 0.33, 0]}>
        {/* 몸통 */}
        <S p={[0, 0.1, -0.02]} sc={[0.22, 0.22, 0.38]} c={C.body} map={furMap} />
        <S p={[0, 0.06, 0.12]} sc={[0.17, 0.17, 0.2]} c={C.belly} map={furMap} />
        {/* 다리 */}
        {[
          [0.12, 0.22],
          [-0.12, 0.22],
          [0.12, -0.24],
          [-0.12, -0.24],
        ].map(([x, z], i) => (
          <group key={i} ref={legs[i]} position={[x, 0.02, z]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.2, 6, 10]} />
              <M c={i < 2 ? C.legs : C.body} />
            </mesh>
            <S p={[0, -0.31, 0.03]} sc={[0.06, 0.04, 0.075]} c={C.paws} />
          </group>
        ))}
        {/* 말린 꼬리 */}
        <group ref={tail} position={[0, 0.2, -0.36]}>
          <mesh position={[0, 0.1, 0.02]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.09, 0.05, 10, 18, Math.PI * 1.5]} />
            <M c={C.tail} />
          </mesh>
        </group>
        {/* 머리 */}
        <group ref={head} position={[0, 0.33, 0.34]}>
          <S p={[0, 0, 0]} r={0.2} c={C.body} map={furMap} />
          <S p={[0, -0.06, 0.15]} sc={[0.1, 0.08, 0.11]} c={C.muzzle} />
          <S p={[0, -0.03, 0.255]} r={0.03} c="#251b16" />
          {[-1, 1].map((s) => (
            <group key={s}>
              <S p={[s * 0.075, 0.03, 0.168]} r={0.024} c="#221915" />
              <S p={[s * 0.068, 0.04, 0.186]} r={0.007} c="#ffffff" />
              <S p={[s * 0.13, -0.05, 0.12]} sc={[0.04, 0.022, 0.02]} c="#ffb3b3" />
              <mesh position={[s * 0.11, 0.18, -0.02]} rotation={[0, 0, -s * 0.32]} castShadow>
                <coneGeometry args={[0.065, 0.14, 10]} />
                <M c={C.body} />
              </mesh>
              <mesh position={[s * 0.11, 0.17, 0.004]} rotation={[0.1, 0, -s * 0.32]}>
                <coneGeometry args={[0.036, 0.09, 8]} />
                <M c={C.inner} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.11, 0.18]} rotation={[0.35, 0, 0]}>
            <sphereGeometry args={[0.028, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c="#ef8a8a" />
          </mesh>
        </group>
        {/* 목걸이 */}
        <mesh position={[0, 0.24, 0.24]} rotation={[Math.PI / 2 - 0.5, 0, 0]}>
          <torusGeometry args={[0.13, 0.022, 8, 20]} />
          <M c={C.collar} rough={0.6} />
        </mesh>
      </group>
      <Hearts fxKey="dogs" y={1.05} />
    </group>
  )
}

function angLerp(a, b, t) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

export const DOG_COLORS = {
  baekgu: { body: '#f6f1e7', belly: '#fffaf1', legs: '#f6f1e7', paws: '#fffaf1', tail: '#f6f1e7', muzzle: '#fffaf3', inner: '#ffc9c0', collar: '#c94a3c', fur: 'furWhite' },
  gray: { body: '#9d978e', belly: '#d8d2c8', legs: '#c9c2b6', paws: '#e6e0d6', tail: '#8d877e', muzzle: '#d8d2c8', inner: '#e9b4aa', collar: '#3f6ea8', fur: 'furGray' },
}

// =============================================================
//  갈색 푸들 (거실) — 곱슬곱슬한 털 뭉치를 인스턴싱한 작은 구로 표현
// =============================================================
function CurlBlob({ c, rad, n, rr = 0.055, color, seed = 1 }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const r = rng(seed)
    const m = new THREE.Matrix4()
    const col = new THREE.Color()
    const base = new THREE.Color(color)
    for (let i = 0; i < n; i++) {
      const th = r() * Math.PI * 2
      const ph = Math.acos(r() * 2 - 1)
      const k = 0.85 + r() * 0.2
      const s = 0.75 + r() * 0.5
      m.compose(
        new THREE.Vector3(Math.sin(ph) * Math.cos(th) * rad[0] * k, Math.cos(ph) * rad[1] * k, Math.sin(ph) * Math.sin(th) * rad[2] * k),
        new THREE.Quaternion(),
        new THREE.Vector3(s, s, s)
      )
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, col.copy(base).offsetHSL(0, (r() - 0.5) * 0.08, (r() - 0.5) * 0.12))
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
  }, [])
  return (
    <group position={c}>
      <mesh scale={rad.map((v) => v * 0.92)} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <instancedMesh ref={ref} args={[null, null, n]} castShadow receiveShadow>
        <icosahedronGeometry args={[rr, 1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </group>
  )
}

export function Poodle({ position, rotation = 0 }) {
  const fxT = useStore((s) => s.fx.poodle || 0)
  const root = useRef()
  const inner = useRef()
  const tail = useRef()
  const head = useRef()
  const st = useRef({ heading: rotation })
  const B = '#a5653a'
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const t = state.clock.elapsedTime
    const dx = player.pos.x - position[0]
    const dz = player.pos.z - position[2]
    const dp = Math.hypot(dx, dz)
    const near = dp < 2.4
    const since = (performance.now() - fxT) / 1000
    const excited = fxT && since < 1.8
    const s = st.current
    s.heading = angLerp(s.heading, near || excited ? Math.atan2(dx, dz) : rotation, Math.min(1, dt * 5))
    let y = 0
    let spin = 0
    if (excited) {
      y = Math.abs(Math.sin(since * 7)) * 0.35
      spin = since < 1.0 ? since * Math.PI * 2 : 0
    } else if (near) y = Math.abs(Math.sin(t * 7)) * 0.13
    if (root.current) {
      root.current.position.set(position[0], position[1] + y, position[2])
      root.current.rotation.y = s.heading + spin
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * (near || excited ? 24 : 6)) * 0.5
    if (head.current) head.current.rotation.z = near ? Math.sin(t * 3) * 0.15 : Math.sin(t * 0.8) * 0.06
    if (inner.current) inner.current.scale.y = 1 + (near ? Math.sin(t * 7) * 0.03 : 0)
  })
  return (
    <group ref={root} {...clickable(hugPoodle)}>
      <group ref={inner}>
        <CurlBlob c={[0, 0.3, -0.03]} rad={[0.19, 0.22, 0.22]} n={80} color={B} seed={1} />
        <CurlBlob c={[0, 0.4, 0.11]} rad={[0.14, 0.14, 0.11]} n={40} color={B} seed={2} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <CurlBlob c={[s * 0.14, 0.13, -0.07]} rad={[0.09, 0.09, 0.11]} n={22} color={B} seed={3 + s} />
            <mesh position={[s * 0.075, 0.12, 0.13]} castShadow>
              <cylinderGeometry args={[0.04, 0.035, 0.24, 10]} />
              <meshStandardMaterial color="#b77548" roughness={1} />
            </mesh>
            <CurlBlob c={[s * 0.075, 0.03, 0.15]} rad={[0.055, 0.04, 0.06]} n={14} rr={0.035} color={B} seed={6 + s} />
          </group>
        ))}
        <group ref={tail} position={[0, 0.3, -0.27]}>
          <CurlBlob c={[0, 0.06, -0.02]} rad={[0.065, 0.065, 0.065]} n={18} rr={0.04} color={B} seed={9} />
        </group>
        <group ref={head} position={[0, 0.64, 0.1]}>
          <CurlBlob c={[0, 0, 0]} rad={[0.16, 0.15, 0.15]} n={60} color={B} seed={10} />
          <CurlBlob c={[0, 0.15, -0.02]} rad={[0.1, 0.08, 0.1]} n={26} rr={0.045} color={B} seed={11} />
          {[-1, 1].map((s) => (
            <CurlBlob key={s} c={[s * 0.16, -0.09, 0]} rad={[0.06, 0.13, 0.07]} n={24} rr={0.045} color="#97592f" seed={12 + s} />
          ))}
          <S p={[0, -0.05, 0.15]} sc={[0.075, 0.06, 0.085]} c="#c38c5c" />
          <S p={[0, -0.03, 0.235]} r={0.026} c="#2a1a14" />
          {[-1, 1].map((s) => (
            <group key={'e' + s}>
              <S p={[s * 0.06, 0.03, 0.14]} r={0.026} c="#1d1410" />
              <S p={[s * 0.054, 0.04, 0.162]} r={0.007} c="#ffffff" />
            </group>
          ))}
          <mesh position={[0, -0.1, 0.17]} rotation={[0.4, 0, 0]}>
            <sphereGeometry args={[0.022, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ef8a8a" />
          </mesh>
          {/* 리본 */}
          <mesh position={[0.06, 0.2, 0.02]} rotation={[0, 0, 0.6]}>
            <torusGeometry args={[0.03, 0.012, 6, 12]} />
            <meshStandardMaterial color="#e8708a" />
          </mesh>
        </group>
      </group>
      <Hearts fxKey="poodle" y={1.05} />
    </group>
  )
}
