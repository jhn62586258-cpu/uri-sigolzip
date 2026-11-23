import React, { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getTex, rng } from '../lib/textures'

// =============================================================
//  자연물: 잎사귀 군집(인스턴싱된 잎 카드), 토분 화분, 잔디 덤불
//  공을 뭉쳐놓은 느낌 대신, 알파 잎사귀 수백 장을 겹쳐 자연스러운 실루엣을 만듭니다.
// =============================================================

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _s = new THREE.Vector3()
const _p = new THREE.Vector3()
const _c = new THREE.Color()

/** items: [{ p:[x,y,z], r:[rx,ry,rz], s:number, c:'#hex' }] */
export function LeafCards({ items, tex = 'leafCluster', cast = true, rough = 0.85, aspect }) {
  const asp = aspect ?? (tex === 'leaf' ? 0.5 : 1)
  const ref = useRef()
  const map = useMemo(() => getTex(tex), [tex])
  const depth = useMemo(
    () => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 }),
    [map]
  )
  useLayoutEffect(() => {
    const mesh = ref.current
    items.forEach((it, i) => {
      _p.set(...it.p)
      _q.setFromEuler(_e.set(it.r[0], it.r[1], it.r[2], it.o || 'XYZ'))
      _s.set(it.s, it.s, it.s)
      _m.compose(_p, _q, _s)
      mesh.setMatrixAt(i, _m)
      mesh.setColorAt(i, _c.set(it.c))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return (
    <instancedMesh ref={ref} args={[null, null, items.length]} castShadow={cast} receiveShadow customDepthMaterial={depth}>
      <planeGeometry args={[asp, 1]} />
      <meshStandardMaterial map={map} alphaTest={0.5} side={THREE.DoubleSide} roughness={rough} />
    </instancedMesh>
  )
}

const LEAF_GREENS = ['#5f7f34', '#6d8c3a', '#7a9744', '#55722e', '#86a04c', '#4c6a2b']

/** 타원체 껍질 위에 잎 카드를 흩뿌린 수관(나무 머리) */
export function canopyItems(blobs, perBlob = 120, seed = 1, palette = LEAF_GREENS, size = [0.55, 0.85]) {
  const r = rng(seed)
  const out = []
  blobs.forEach(([cx, cy, cz, rad]) => {
    for (let i = 0; i < perBlob; i++) {
      const th = r() * Math.PI * 2
      const ph = Math.acos(r() * 2 - 1)
      const k = 0.65 + r() * 0.4
      const x = cx + Math.sin(ph) * Math.cos(th) * rad * k
      const y = cy + Math.cos(ph) * rad * 0.85 * k
      const z = cz + Math.sin(ph) * Math.sin(th) * rad * k
      out.push({
        p: [x, y, z],
        r: [r() * Math.PI, r() * Math.PI * 2, r() * Math.PI],
        s: size[0] + r() * (size[1] - size[0]),
        c: palette[Math.floor(r() * palette.length)],
      })
    }
  })
  return out
}

// ---------- 토분 화분 ----------
const POT_PROFILE = [
  [0.0, 0],
  [0.14, 0],
  [0.15, 0.02],
  [0.2, 0.3],
  [0.215, 0.3],
  [0.225, 0.31],
  [0.225, 0.37],
  [0.205, 0.38],
  [0.195, 0.34],
  [0.0, 0.34],
]

export function Plant({ p, s = 1, leaf = '#6d8c3a', flowers, variant = 'bush', seed }) {
  const potTex = useMemo(() => getTex('terracotta', 2, 1), [])
  const prof = useMemo(() => POT_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), [])
  const sd = seed ?? Math.round((p[0] * 13 + p[2] * 7) * 10)
  const items = useMemo(() => {
    const r = rng(Math.abs(sd) + 3)
    const base = new THREE.Color(leaf)
    const arr = []
    const n = variant === 'tall' ? 46 : 34
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2
      const tilt = 0.2 + r() * (variant === 'tall' ? 0.75 : 1.1)
      const size = 0.16 + r() * 0.13
      const h0 = variant === 'tall' ? 0.36 + r() * 0.7 : 0.33 + r() * 0.2
      const ox = Math.cos(ang)
      const oz = Math.sin(ang)
      const c = base.clone().offsetHSL((r() - 0.5) * 0.04, (r() - 0.5) * 0.1, (r() - 0.5) * 0.12)
      arr.push({
        p: [ox * (0.03 + Math.sin(tilt) * size * 0.5), h0 + Math.cos(tilt) * size * 0.5, oz * (0.03 + Math.sin(tilt) * size * 0.5)],
        r: [tilt, Math.atan2(ox, oz), (r() - 0.5) * 0.5],
        o: 'YXZ',
        s: size,
        c: '#' + c.getHexString(),
      })
    }
    return arr
  }, [leaf, variant, sd])
  const blooms = useMemo(() => {
    if (!flowers) return []
    const r = rng(Math.abs(sd) + 9)
    return Array.from({ length: 5 }, () => {
      const a = r() * Math.PI * 2
      return [Math.cos(a) * 0.15, 0.55 + r() * 0.2, Math.sin(a) * 0.15]
    })
  }, [flowers, sd])
  return (
    <group position={p} scale={s}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[prof, 24]} />
        <meshStandardMaterial map={potTex} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 20]} />
        <meshStandardMaterial color="#4a3526" roughness={1} />
      </mesh>
      <LeafCards items={items} tex="leaf" />
      {blooms.map((b, i) => (
        <group key={i} position={b}>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <mesh key={k} position={[Math.cos(k) * 0.04, Math.sin(k * 2.1) * 0.03, Math.sin(k) * 0.04]}>
              <sphereGeometry args={[0.032, 8, 6]} />
              <meshStandardMaterial color={flowers} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** 마당 잔디 덤불 (따뜻한 연두빛) */
export function GrassTufts({ count = 420, area = [20, 16], center = [0, -1], avoid = [], seed = 5 }) {
  const items = useMemo(() => {
    const r = rng(seed)
    const arr = []
    let tries = 0
    while (arr.length < count && tries < count * 5) {
      tries++
      const x = center[0] + (r() - 0.5) * area[0]
      const z = center[1] + (r() - 0.5) * area[1]
      if (avoid.some(([a, b, c, d]) => x > a && x < b && z > c && z < d)) continue
      const s = 0.16 + r() * 0.16
      const g = ['#b4c46e', '#c2cc78', '#a9bd66', '#cdd38a', '#b8c872'][Math.floor(r() * 5)]
      const yaw = r() * Math.PI
      arr.push({ p: [x, s / 2 - 0.02, z], r: [0, yaw, 0], s, c: g })
      arr.push({ p: [x, s / 2 - 0.02, z], r: [0, yaw + Math.PI / 2, 0], s, c: g })
    }
    return arr
  }, [count, seed])
  return <LeafCards items={items} tex="grassTuft" cast={false} rough={1} />
}
