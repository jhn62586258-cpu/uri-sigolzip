import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../lib/store'

/** 비 내리는 파티클 (선분). exclude: 지붕 아래 등 비가 안 들어오는 사각 영역 */
export function Rain({ count = 1100, area = [30, 26], center = [0, -1], height = 14, exclude = [] }) {
  const ref = useRef()
  const { geo, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 6)
    const sp = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = center[0] + (Math.random() - 0.5) * area[0]
      const z = center[1] + (Math.random() - 0.5) * area[1]
      const y = Math.random() * height
      pos.set([x, y, z, x + 0.03, y - 0.38, z + 0.01], i * 6)
      sp[i] = 9 + Math.random() * 4
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geo: g, speeds: sp }
  }, [count])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const a = geo.attributes.position.array
    for (let i = 0; i < count; i++) {
      const o = i * 6
      let y = a[o + 1] - speeds[i] * dt
      let x = a[o]
      let z = a[o + 2]
      let reset = y < 0
      if (!reset) {
        for (const e of exclude) {
          if (x > e[0] && x < e[1] && z > e[2] && z < e[3] && y < e[4]) {
            reset = true
            break
          }
        }
      }
      if (reset) {
        y = height + Math.random() * 2
        x = center[0] + (Math.random() - 0.5) * area[0]
        z = center[1] + (Math.random() - 0.5) * area[1]
      }
      a[o] = x
      a[o + 1] = y
      a[o + 2] = z
      a[o + 3] = x + 0.03
      a[o + 4] = y - 0.38
      a[o + 5] = z + 0.01
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#dfe8f2" transparent opacity={0.5} />
    </lineSegments>
  )
}

/** 김 (찌개, 주전자). fxKey 효과음이 재생되면 김이 많이 납니다. */
export function Steam({ p, n = 7, scale = 1, fxKey }) {
  const fxT = useStore((s) => (fxKey ? s.fx[fxKey] || 0 : 0))
  const refs = useRef([])
  const seeds = useMemo(() => Array.from({ length: 14 }, () => Math.random()), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const boost = fxT && performance.now() - fxT < 4500 ? 1 : 0
    refs.current.forEach((m, i) => {
      if (!m) return
      const active = i < n || boost
      const life = (t * (0.35 + boost * 0.3) + seeds[i]) % 1
      m.visible = !!active
      m.position.set(Math.sin(t * 1.3 + i) * 0.05 * scale, life * 0.7 * scale * (1 + boost * 0.6), Math.cos(t + i) * 0.04 * scale)
      const s = (0.05 + life * 0.12) * scale * (1 + boost * 0.5)
      m.scale.set(s, s, s)
      m.material.opacity = (1 - life) * 0.4
    })
  })
  return (
    <group position={p}>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/** 깜빡이는 따뜻한 조명 (난로, 랜턴) */
export function FlickerLight({ p, color = '#ff9a3c', intensity = 2, distance = 5, speed = 1 }) {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    if (ref.current) ref.current.intensity = intensity * (0.85 + Math.sin(t * 13) * 0.06 + Math.sin(t * 7.3) * 0.06 + Math.random() * 0.05)
  })
  return <pointLight ref={ref} position={p} color={color} intensity={intensity} distance={distance} decay={1.6} />
}

/** 꼬마전구 줄 */
export function FairyLights({ from, to, n = 14, sag = 0.12, color = '#ffd27a' }) {
  const pts = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1)
      const p = a.clone().lerp(b, t)
      p.y -= Math.sin(t * Math.PI) * sag
      return p
    })
  }, [from, to, n, sag])
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts), [pts])
  const mats = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    mats.current.forEach((m, i) => m && (m.emissiveIntensity = 1.6 + Math.sin(t * 2 + i * 1.7) * 0.6))
  })
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 40, 0.006, 4, false]} />
        <meshStandardMaterial color="#4a4030" />
      </mesh>
      {pts.map((p, i) => (
        <mesh key={i} position={[p.x, p.y - 0.025, p.z]}>
          <sphereGeometry args={[0.026, 10, 8]} />
          <meshStandardMaterial ref={(el) => (mats.current[i] = el)} color={color} emissive={color} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/** 흔들리는 화면 (TV/모니터) */
export function Screen({ p, w, h, map, r }) {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      const v = 0.95 + Math.sin(t * 3.1) * 0.04 + (Math.random() < 0.02 ? -0.12 : 0)
      ref.current.color.setRGB(v, v, v * 1.02)
      ref.current.map.offset.x = (t * 0.004) % 1
    }
  })
  return (
    <mesh position={p} rotation={r}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={ref} map={map} toneMapped={false} />
    </mesh>
  )
}
