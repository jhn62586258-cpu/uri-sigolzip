import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../lib/store'
import { getTex } from '../lib/textures'

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
      pos.set([x, y, z, x + 0.01, y - 0.14, z + 0.004], i * 6)
      sp[i] = 2.8 + Math.random() * 1.6
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
      let x = a[o] + Math.sin(performance.now() * 0.0004 + i) * dt * 0.15
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
      a[o + 3] = x + 0.01 + Math.sin(y * 0.7 + i) * 0.004
      a[o + 4] = y - 0.14
      a[o + 5] = z + 0.004
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#eef3f8" transparent opacity={0.28} depthWrite={false} />
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

// =============================================================
//  반딧불이 (별빛 밤)
// =============================================================
let _glowTex = null
function glowTex() {
  if (_glowTex) return _glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(240,255,170,1)')
  grd.addColorStop(0.25, 'rgba(210,255,120,0.6)')
  grd.addColorStop(1, 'rgba(180,255,80,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  _glowTex = new THREE.CanvasTexture(c)
  return _glowTex
}

export function Fireflies({ count = 70, area = [20, 14], center = [0, -1], height = [0.3, 2.6] }) {
  const pts = useRef()
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: center[0] + (Math.random() - 0.5) * area[0],
        z: center[1] + (Math.random() - 0.5) * area[1],
        y: height[0] + Math.random() * (height[1] - height[0]),
        a: Math.random() * 10,
        sp: 0.3 + Math.random() * 0.5,
      })),
    [count]
  )
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    return g
  }, [count])
  const mat = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const a = geo.attributes.position.array
    seeds.forEach((s, i) => {
      a[i * 3] = s.x + Math.sin(t * s.sp + s.a) * 0.8
      a[i * 3 + 1] = s.y + Math.sin(t * s.sp * 1.7 + s.a * 2) * 0.3
      a[i * 3 + 2] = s.z + Math.cos(t * s.sp * 0.8 + s.a) * 0.8
    })
    geo.attributes.position.needsUpdate = true
    if (mat.current) mat.current.opacity = 0.75 + Math.sin(t * 2.3) * 0.25
  })
  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        ref={mat}
        map={glowTex()}
        size={0.42}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        color="#e6ff9a"
      />
    </points>
  )
}

// =============================================================
//  TV 채널 화면 (캔버스에 실시간으로 그림)
// =============================================================
function drawTv(g, w, h, ch, t, land) {
  if (ch === 0) {
    const off = (t * 8) % w
    g.drawImage(land, -off, 0, w, h)
    g.drawImage(land, w - off, 0, w, h)
  } else if (ch === 1) {
    g.fillStyle = '#120a06'
    g.fillRect(0, 0, w, h)
    const grd = g.createRadialGradient(w / 2, h * 0.85, 5, w / 2, h * 0.8, h * 0.8)
    grd.addColorStop(0, 'rgba(255,140,40,0.6)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 26; i++) {
      const x = w / 2 + Math.sin(i * 1.7) * w * 0.18
      const fl = 0.5 + 0.5 * Math.sin(t * (6 + (i % 5)) + i)
      const hh = h * (0.25 + fl * 0.35)
      g.fillStyle = i % 3 ? `rgba(255,${120 + (i % 4) * 30},30,0.55)` : 'rgba(255,230,140,0.6)'
      g.beginPath()
      g.moveTo(x - 14, h * 0.86)
      g.quadraticCurveTo(x + Math.sin(t * 5 + i) * 10, h * 0.86 - hh * 0.6, x + Math.sin(t * 3 + i) * 6, h * 0.86 - hh)
      g.quadraticCurveTo(x + 6, h * 0.86 - hh * 0.4, x + 14, h * 0.86)
      g.fill()
    }
    g.fillStyle = '#3a2418'
    g.save()
    g.translate(w / 2, h * 0.9)
    g.rotate(0.2)
    g.fillRect(-60, -8, 120, 16)
    g.rotate(-0.4)
    g.fillRect(-60, -8, 120, 16)
    g.restore()
    for (let i = 0; i < 12; i++) {
      const life = (t * 0.6 + i * 0.37) % 1
      g.fillStyle = `rgba(255,190,90,${1 - life})`
      g.fillRect(w / 2 + Math.sin(i * 3 + t) * 40, h * 0.8 - life * h * 0.7, 2, 2)
    }
  } else if (ch === 2) {
    const grd = g.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, '#5f7a6a')
    grd.addColorStop(1, '#1f3426')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 9; i++) {
      const x = (i * 37) % w
      g.fillStyle = i % 2 ? '#1d3022' : '#2a4430'
      g.beginPath()
      g.moveTo(x, h)
      g.lineTo(x + 18, h * 0.15 + (i % 3) * 10)
      g.lineTo(x + 36, h)
      g.fill()
    }
    g.strokeStyle = 'rgba(220,235,240,0.45)'
    g.lineWidth = 1
    for (let i = 0; i < 70; i++) {
      const x = (i * 53 + t * 40) % w
      const y = (i * 29 + t * 260) % h
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x - 3, y + 12)
      g.stroke()
    }
    g.fillStyle = 'rgba(200,220,230,0.15)'
    g.fillRect(0, 0, w, h)
  } else {
    g.fillStyle = '#ffe9f0'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#b8e6b0'
    g.fillRect(0, h * 0.75, w, h * 0.25)
    for (let i = 0; i < 6; i++) {
      g.fillStyle = ['#ffd56b', '#9fd3ff', '#ffb3c8'][i % 3]
      g.beginPath()
      g.arc((i * 61 + t * 30) % w, 22 + (i % 2) * 14, 5, 0, Math.PI * 2)
      g.fill()
    }
    const bx = w / 2 + Math.sin(t * 1.5) * w * 0.25
    const by = h * 0.75 - Math.abs(Math.sin(t * 4)) * h * 0.35
    const sq = 1 + (by > h * 0.7 ? 0.15 : 0)
    g.fillStyle = '#ffd23f'
    g.beginPath()
    g.ellipse(bx, by - 22, 26 * sq, 24 / sq, 0, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#4a3326'
    g.lineWidth = 3
    g.lineCap = 'round'
    ;[-9, 9].forEach((dx) => {
      g.beginPath()
      g.arc(bx + dx, by - 24, 4, Math.PI * 1.1, Math.PI * 1.9)
      g.stroke()
    })
    g.fillStyle = '#ff9a9a'
    g.beginPath()
    g.arc(bx - 15, by - 16, 4, 0, Math.PI * 2)
    g.arc(bx + 15, by - 16, 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f08a24'
    g.beginPath()
    g.moveTo(bx - 4, by - 18)
    g.lineTo(bx + 4, by - 18)
    g.lineTo(bx, by - 13)
    g.fill()
  }
  g.fillStyle = 'rgba(255,255,255,0.8)'
  g.font = 'bold 13px sans-serif'
  g.fillText('CH ' + (ch + 1), w - 44, 18)
}

export function TvScreen({ p, w, h, channel = 0, landKey = 'landscape2' }) {
  const ref = useRef()
  const { canvas, tex, land } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 150
    const tx = new THREE.CanvasTexture(c)
    tx.colorSpace = THREE.SRGBColorSpace
    return { canvas: c, tex: tx, land: getTex(landKey).image }
  }, [landKey])
  const last = useRef(0)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (t - last.current < 1 / 20) return
    last.current = t
    drawTv(canvas.getContext('2d'), canvas.width, canvas.height, channel, t, land)
    tex.needsUpdate = true
  })
  return (
    <mesh ref={ref} position={p}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}
