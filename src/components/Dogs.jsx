import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useStore } from '../lib/store'
import { player } from '../lib/shared'
import { addSolid, resolveCollisions } from '../lib/collision'
import { getTex, getFaceTex, rng } from '../lib/textures'
import { petDogs, hugPoodle, petCat as petCatAction, meow } from '../lib/actions'

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

// ---------- 이름표 (항상 표시, 가까이 가면 살짝 커짐) ----------
export function NameTag({ name, y = 1.0, getPos }) {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current || !getPos) return
    const p = getPos()
    const near = Math.hypot(player.pos.x - p[0], player.pos.z - p[1]) < 3
    ref.current.classList.toggle('near', near)
  })
  return (
    <Html position={[0, y, 0]} center zIndexRange={[12, 5]}>
      <div ref={ref} className="nametag">
        {name}
      </div>
    </Html>
  )
}

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
  const getPos = () => [st.current.pos.x, st.current.pos.z]
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
      {name && <NameTag name={name} y={1.02} getPos={getPos} />}
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
//  갈색 푸들 '사월이' (거실)
//  작은 구를 촘촘히 겹치지 않고, 큼직한 구·캡슐 몇 개로 몽글몽글하게 표현
// =============================================================
function Puff({ p, sc, c = '#b0714a', r = 1 }) {
  return (
    <mesh position={p} scale={sc} castShadow receiveShadow>
      <sphereGeometry args={[r, 32, 24]} />
      <meshPhysicalMaterial color={c} roughness={1} sheen={1} sheenRoughness={0.6} sheenColor="#ffe2c8" />
    </mesh>
  )
}
function Cap({ p, r, len, rot, c = '#b0714a' }) {
  return (
    <mesh position={p} rotation={rot} castShadow>
      <capsuleGeometry args={[r, len, 10, 20]} />
      <meshPhysicalMaterial color={c} roughness={1} sheen={1} sheenRoughness={0.6} sheenColor="#ffe2c8" />
    </mesh>
  )
}

export function Poodle({ position, rotation = 0, name = '사월이' }) {
  const fxT = useStore((s) => s.fx.poodle || 0)
  const root = useRef()
  const inner = useRef()
  const tail = useRef()
  const head = useRef()
  const st = useRef({ heading: rotation })
  const B = '#b0714a'
  const D = '#9a5f3b'
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
    // 숨쉬듯 말랑말랑
    if (inner.current) {
      const b = Math.sin(t * (near ? 7 : 2.2)) * (near ? 0.035 : 0.015)
      inner.current.scale.set(1 - b * 0.5, 1 + b, 1 - b * 0.5)
    }
  })
  return (
    <group ref={root} {...clickable(hugPoodle)}>
      <group ref={inner}>
        {/* 앉은 몸통 + 가슴 털 */}
        <Puff p={[0, 0.25, -0.04]} sc={[0.21, 0.23, 0.24]} c={B} />
        <Puff p={[0, 0.36, 0.1]} sc={[0.16, 0.16, 0.13]} c={B} />
        {/* 뒷다리 엉덩이 */}
        {[-1, 1].map((s) => (
          <Puff key={'h' + s} p={[s * 0.13, 0.12, -0.06]} sc={[0.1, 0.1, 0.13]} c={B} />
        ))}
        {/* 앞다리(캡슐) + 동그란 발 방울 */}
        {[-1, 1].map((s) => (
          <group key={'f' + s}>
            <Cap p={[s * 0.075, 0.15, 0.14]} r={0.038} len={0.14} c="#bf8159" />
            <Puff p={[s * 0.075, 0.045, 0.16]} sc={[0.06, 0.05, 0.065]} c={B} />
          </group>
        ))}
        {/* 꼬리 방울 */}
        <group ref={tail} position={[0, 0.3, -0.26]}>
          <Cap p={[0, 0.03, -0.01]} r={0.022} len={0.06} rot={[-0.5, 0, 0]} c="#bf8159" />
          <Puff p={[0, 0.09, -0.04]} sc={[0.07, 0.07, 0.07]} c={B} />
        </group>
        {/* 머리 */}
        <group ref={head} position={[0, 0.6, 0.1]}>
          <Puff p={[0, 0, 0]} sc={[0.16, 0.15, 0.15]} c={B} />
          {/* 정수리 방울 */}
          <Puff p={[0, 0.14, -0.02]} sc={[0.11, 0.09, 0.1]} c={B} />
          {/* 축 늘어진 귀 (긴 캡슐) */}
          {[-1, 1].map((s) => (
            <Cap key={s} p={[s * 0.15, -0.07, 0.0]} r={0.055} len={0.12} rot={[0, 0, s * 0.18]} c={D} />
          ))}
          {/* 주둥이 */}
          <Puff p={[0, -0.045, 0.13]} sc={[0.075, 0.06, 0.075]} c="#cf9a6c" />
          <Puff p={[0, -0.025, 0.2]} sc={[0.026, 0.022, 0.022]} c="#2a1a14" />
          {[-1, 1].map((s) => (
            <group key={'e' + s}>
              <Puff p={[s * 0.06, 0.03, 0.135]} sc={[0.024, 0.028, 0.02]} c="#1d1410" />
              <Puff p={[s * 0.053, 0.042, 0.152]} sc={[0.007, 0.007, 0.007]} c="#ffffff" />
              <Puff p={[s * 0.1, -0.03, 0.115]} sc={[0.03, 0.017, 0.012]} c="#ffa9a9" />
            </group>
          ))}
          <mesh position={[0, -0.09, 0.17]} rotation={[0.4, 0, 0]}>
            <sphereGeometry args={[0.022, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ef8a8a" />
          </mesh>
          {/* 리본 */}
          {[-1, 1].map((s) => (
            <Puff key={'r' + s} p={[0.07 + s * 0.035, 0.2, 0.02]} sc={[0.035, 0.022, 0.015]} c="#ee7f98" />
          ))}
          <Puff p={[0.07, 0.2, 0.025]} sc={[0.014, 0.014, 0.014]} c="#d9607c" />
        </group>
      </group>
      <Hearts fxKey="poodle" y={1.05} />
      <NameTag name={name} y={1.0} getPos={() => [position[0], position[2]]} />
    </group>
  )
}

// =============================================================
//  마당 고양이 (마시멜로 스타일 치즈냥)
//  · 가까이 가면 "야옹~", 클릭/버튼으로 쓰다듬으면 골골송 + 하트
// =============================================================
export function Cat({ position, rotation = 0 }) {
  const fxT = useStore((s) => s.fx.cat || 0)
  const near = useStore((s) => s.near.includes('cat'))
  const faceTex = useMemo(() => getFaceTex({ eyes: 'smile', mouth: 'cat', blush: 'rgba(255,140,140,0.75)' }), [])
  const root = useRef()
  const body = useRef()
  const tail = useRef()
  const head = useRef()
  const st = useRef({ heading: rotation })
  const W = '#fff7ec'
  const O = '#f2b16a'
  useEffect(() => {
    if (near) meow()
  }, [near])
  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const t = state.clock.elapsedTime
    const dx = player.pos.x - position[0]
    const dz = player.pos.z - position[2]
    const close = Math.hypot(dx, dz) < 2.4
    const since = (performance.now() - fxT) / 1000
    const petted = fxT && since < 2.2
    const s = st.current
    s.heading = angLerp(s.heading, close ? Math.atan2(dx, dz) : rotation, Math.min(1, dt * 3))
    if (root.current) root.current.rotation.y = s.heading
    if (body.current) {
      const b = petted ? Math.sin(t * 14) * 0.02 : Math.sin(t * 1.8) * 0.015
      body.current.scale.set(1 - b * 0.5, 1 + b, 1 - b * 0.5)
    }
    if (tail.current) tail.current.rotation.y = Math.sin(t * (petted ? 6 : 1.5)) * (petted ? 0.6 : 0.35)
    if (head.current) {
      head.current.rotation.z = petted ? Math.sin(t * 5) * 0.2 : Math.sin(t * 0.7) * 0.08
      head.current.rotation.x = petted ? 0.15 : 0
    }
  })
  return (
    <group position={position}>
      <group ref={root} {...clickable(petCatAction)}>
        <group ref={body}>
          {/* 식빵 자세 몸통 */}
          <Puff p={[0, 0.17, -0.04]} sc={[0.2, 0.17, 0.25]} c={W} />
          <Puff p={[0, 0.25, -0.12]} sc={[0.15, 0.08, 0.13]} c={O} />
          {/* 앞발 */}
          {[-1, 1].map((s) => (
            <Puff key={s} p={[s * 0.08, 0.04, 0.17]} sc={[0.055, 0.04, 0.07]} c={W} />
          ))}
          {/* 꼬리 */}
          <group ref={tail} position={[0, 0.08, -0.27]}>
            <Cap p={[0.06, 0.02, -0.04]} r={0.035} len={0.16} rot={[Math.PI / 2, 0, 0.9]} c={O} />
          </group>
          {/* 머리 */}
          <group ref={head} position={[0, 0.38, 0.1]}>
            <mesh castShadow scale={[1.08, 0.95, 1]}>
              <sphereGeometry args={[0.16, 32, 24]} />
              <meshPhysicalMaterial color={W} roughness={1} sheen={1} sheenRoughness={0.6} sheenColor="#ffffff" />
            </mesh>
            <mesh scale={[1.08, 0.95, 1]} renderOrder={2}>
              <sphereGeometry args={[0.1615, 32, 24, Math.PI / 2 - 0.85, 1.7, 0.95, 1.2]} />
              <meshStandardMaterial map={faceTex} transparent depthWrite={false} roughness={1} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
            {/* 이마 무늬 */}
            <Puff p={[0, 0.1, 0.02]} sc={[0.09, 0.05, 0.1]} c={O} />
            {/* 동그란 귀 */}
            {[-1, 1].map((s) => (
              <group key={'ear' + s} position={[s * 0.1, 0.13, 0]} rotation={[0, 0, -s * 0.35]}>
                <Puff p={[0, 0, 0]} sc={[0.055, 0.07, 0.035]} c={s > 0 ? O : W} />
                <Puff p={[0, -0.005, 0.018]} sc={[0.03, 0.045, 0.015]} c="#ffc2c2" />
              </group>
            ))}
          </group>
        </group>
        <Hearts fxKey="cat" y={0.85} />
      </group>
    </group>
  )
}
