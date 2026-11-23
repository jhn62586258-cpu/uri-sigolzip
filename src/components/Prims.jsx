import React, { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox, Html } from '@react-three/drei'
import { addSolid, rectSolid, circleSolid } from '../lib/collision'
import { DEBUG, player, cam } from '../lib/shared'
import { getTex } from '../lib/textures'
import { goTo } from '../lib/actions'
import { useStore } from '../lib/store'
import { THEMES } from '../lib/theme'

// ---------- 기본 도형 헬퍼 ----------
export function Box({ p = [0, 0, 0], s = [1, 1, 1], r, c = '#ffffff', rough = 0.85, metal = 0, map, emissive, ei = 1, cast = true, receive = true, opacity, onClick, side }) {
  return (
    <mesh position={p} rotation={r} castShadow={cast} receiveShadow={receive} onClick={onClick}>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        map={map || null}
        emissive={emissive || '#000000'}
        emissiveIntensity={ei}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
        side={side}
      />
    </mesh>
  )
}

export function RBox({ p = [0, 0, 0], s = [1, 1, 1], r, c = '#ffffff', rad = 0.06, rough = 0.9, map, cast = true, emissive, ei = 1 }) {
  return (
    <RoundedBox args={s} radius={Math.min(rad, Math.min(...s) / 2 - 0.001)} smoothness={3} position={p} rotation={r} castShadow={cast} receiveShadow>
      <meshStandardMaterial color={c} roughness={rough} map={map || null} emissive={emissive || '#000000'} emissiveIntensity={ei} />
    </RoundedBox>
  )
}

export function Cyl({ p = [0, 0, 0], args = [0.5, 0.5, 1, 20], r, c = '#ffffff', rough = 0.85, metal = 0, map, emissive, ei = 1, cast = true, opacity, open }) {
  const a = open ? [...args.slice(0, 4), 1, true] : args
  return (
    <mesh position={p} rotation={r} castShadow={cast} receiveShadow>
      <cylinderGeometry args={a} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        map={map || null}
        emissive={emissive || '#000000'}
        emissiveIntensity={ei}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
        side={open ? THREE.DoubleSide : THREE.FrontSide}
      />
    </mesh>
  )
}

export function Sph({ p = [0, 0, 0], rad = 0.5, sc, r, c = '#ffffff', rough = 0.85, metal = 0, map, emissive, ei = 1, cast = true, seg = 24, opacity }) {
  return (
    <mesh position={p} scale={sc} rotation={r} castShadow={cast} receiveShadow>
      <sphereGeometry args={[rad, seg, Math.max(8, Math.floor(seg * 0.66))]} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        map={map || null}
        emissive={emissive || '#000000'}
        emissiveIntensity={ei}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  )
}

// ---------- 충돌체 ----------
/** 사각형(w×d) 또는 원(r) 충돌체를 등록합니다. 렌더링은 하지 않습니다(?debug 시 표시). */
export function Solid({ x, z, w, d, r }) {
  useLayoutEffect(() => addSolid(r ? circleSolid(x, z, r) : rectSolid(x, z, w, d)), [x, z, w, d, r])
  if (!DEBUG) return null
  return r ? (
    <mesh position={[x, 0.5, z]}>
      <cylinderGeometry args={[r, r, 1, 16]} />
      <meshBasicMaterial color="red" wireframe />
    </mesh>
  ) : (
    <mesh position={[x, 0.5, z]}>
      <boxGeometry args={[w, 1, d]} />
      <meshBasicMaterial color="red" wireframe />
    </mesh>
  )
}

// ---------- 걸을 수 있는 바닥 (클릭 → 이동) ----------
export function WalkFloor({ w, d, p = [0, 0, 0], tex = 'wood', rep = [4, 4], color = '#ffffff', rough = 0.8 }) {
  const map = useMemo(() => getTex(tex, rep[0], rep[1]), [tex, rep[0], rep[1]])
  const onClick = (e) => {
    if (e.delta > 8 || performance.now() - cam.lastPinch < 450) return
    player.target = { x: e.point.x, z: e.point.z }
    player.pendingPose = null
  }
  return (
    <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClick}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={map} color={color} roughness={rough} />
    </mesh>
  )
}

// ---------- 크림 아이보리 회벽 + 원목 몰딩 ----------
export function PlasterWall({ w, h, p, r = [0, 0, 0], tex = 'plaster', molding = true }) {
  const map = useMemo(() => getTex(tex, +(w / 3).toFixed(2), +(h / 3).toFixed(2)), [w, h, tex])
  return (
    <group position={p} rotation={r}>
      <mesh receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} roughness={0.97} />
      </mesh>
      {molding && (
        <>
          {/* 허리 몰딩 + 아래 원목 판벽 */}
          <Box p={[0, -h / 2 + 0.5, 0.012]} s={[w, 0.96, 0.02]} c="#b08559" map={getTex('woodLight', +(w / 1.4).toFixed(2), 0.7)} cast={false} />
          <Box p={[0, -h / 2 + 1.0, 0.03]} s={[w, 0.06, 0.06]} c="#7a5236" cast={false} />
          {Array.from({ length: Math.max(1, Math.floor(w / 1.2)) }).map((_, i, a) => (
            <Box key={i} p={[-w / 2 + ((i + 0.5) * w) / a.length, -h / 2 + 0.52, 0.025]} s={[0.025, 0.86, 0.01]} c="#8a6040" cast={false} />
          ))}
          {/* 천장 몰딩 + 걸레받이 */}
          <Box p={[0, h / 2 - 0.08, 0.04]} s={[w, 0.16, 0.08]} c="#7a5236" cast={false} />
          <Box p={[0, -h / 2 + 0.09, 0.03]} s={[w, 0.18, 0.06]} c="#5a3d2a" cast={false} />
        </>
      )}
    </group>
  )
}

// ---------- 벽돌 벽 (안쪽을 향한 평면) ----------
export function BrickWall({ w, h, p, r = [0, 0, 0], tint = '#f2e6dc' }) {
  const map = useMemo(() => getTex('brick', +(w / 1.5).toFixed(2), +(h / 1.0).toFixed(2)), [w, h])
  const bump = useMemo(() => getTex('brickBump', +(w / 1.5).toFixed(2), +(h / 1.0).toFixed(2)), [w, h])
  return (
    <mesh position={p} rotation={r} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={map} bumpMap={bump} bumpScale={1.2} color={tint} roughness={0.95} />
    </mesh>
  )
}

/**
 * 방 껍데기: 바닥 + 높은 천장 + 벽돌 벽 4면 + 걸레받이 + 천장 보 + 벽 충돌체
 * 벽은 안쪽만 보이는 평면이라, 카메라가 벽 밖으로 나가도 시야가 가려지지 않습니다(돌하우스 방식).
 */
export function RoomShell({ w, d, h, floorTex = 'wood', floorRep, beams = 3, accent = 'back' }) {
  const ceil = useMemo(() => getTex('woodDark', w / 3, d / 3), [w, d])
  const T = 0.6
  return (
    <group>
      <WalkFloor w={w} d={d} tex={floorTex} rep={floorRep || [w / 2.2, d / 2.2]} />
      {/* 앞벽 바깥 툇마루 (카메라가 앞쪽에서 볼 때 바닥이 허공처럼 보이지 않도록) */}
      <mesh position={[0, -0.04, d / 2 + 2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w + 20, 5]} />
        <meshStandardMaterial map={getTex(floorTex, (w + 20) / 2.2, 5 / 2.2)} color="#c9ab8c" roughness={0.9} />
      </mesh>
      <Box p={[0, -0.02, d / 2 + 0.06]} s={[w, 0.08, 0.12]} c="#4a3324" cast={false} />
      {/* 천장 */}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={ceil} color="#e8d6bc" roughness={0.9} />
      </mesh>
      {Array.from({ length: beams }).map((_, i) => (
        <Box key={i} p={[0, h - 0.14, -d / 2 + ((i + 1) * d) / (beams + 1)]} s={[w, 0.24, 0.2]} c="#6b4a33" cast={false} />
      ))}
      <Box p={[0, h - 0.4, 0]} s={[0.24, 0.3, d]} c="#5e402c" cast={false} />
      {/* 벽: 한 면만 빈티지 적벽돌 포인트 월, 나머지는 크림 회벽 + 원목 몰딩 */}
      {[
        ['back', w, [0, h / 2, -d / 2], [0, 0, 0]],
        ['front', w, [0, h / 2, d / 2], [0, Math.PI, 0]],
        ['left', d, [-w / 2, h / 2, 0], [0, Math.PI / 2, 0]],
        ['right', d, [w / 2, h / 2, 0], [0, -Math.PI / 2, 0]],
      ].map(([side, ww, pos, rot]) =>
        side === accent ? (
          <group key={side}>
            <BrickWall w={ww} h={h} p={pos} r={rot} />
            <group position={pos} rotation={rot}>
              <Box p={[0, -h / 2 + 0.09, 0.03]} s={[ww, 0.18, 0.06]} c="#5a3d2a" cast={false} />
              <Box p={[0, h / 2 - 0.08, 0.04]} s={[ww, 0.16, 0.08]} c="#7a5236" cast={false} />
            </group>
          </group>
        ) : (
          <PlasterWall key={side} w={ww} h={h} p={pos} r={rot} molding={side !== 'front'} />
        )
      )}
      {/* 앞벽 양옆 바깥 외벽 (방 밖 빈 공간이 보이지 않게) */}
      {[-1, 1].map((sd) => (
        <group key={'wing' + sd}>
          <mesh position={[sd * (w / 2 + 5), h / 2, d / 2]} receiveShadow>
            <planeGeometry args={[10, h + 0.6]} />
            <meshStandardMaterial map={getTex('plasterOut', 3, 1.5)} color="#e6d6bc" roughness={1} />
          </mesh>
          <Box p={[sd * (w / 2 + 5), 0.2, d / 2 + 0.03]} s={[10, 0.4, 0.06]} c="#6b4a33" cast={false} />
          <Box p={[sd * (w / 2 + 0.1), h / 2, d / 2 + 0.06]} s={[0.22, h + 0.6, 0.14]} c="#6b4a33" cast={false} />
        </group>
      ))}
      {/* 벽 충돌체 */}
      <Solid x={0} z={-d / 2 - T / 2} w={w + 2 * T} d={T} />
      <Solid x={0} z={d / 2 + T / 2} w={w + 2 * T} d={T} />
      <Solid x={-w / 2 - T / 2} z={0} w={T} d={d + 2 * T} />
      <Solid x={w / 2 + T / 2} z={0} w={T} d={d + 2 * T} />
    </group>
  )
}

// ---------- 창문 ----------
export function Window({ p, w = 1.6, h = 1.2, rotY = 0, view = 'auto', curtains = true, frame = '#6b4a33', glow = 1 }) {
  const time = useStore((s) => s.time)
  const key = view === 'auto' ? THEMES[time].view : view
  const map = useMemo(() => getTex(key), [key])
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={map} toneMapped={false} color={new THREE.Color(glow, glow, glow * 0.96)} />
      </mesh>
      <Box p={[0, h / 2 + 0.05, 0.05]} s={[w + 0.2, 0.1, 0.1]} c={frame} />
      <Box p={[0, -h / 2 - 0.05, 0.07]} s={[w + 0.3, 0.1, 0.16]} c={frame} />
      <Box p={[-w / 2 - 0.05, 0, 0.05]} s={[0.1, h + 0.2, 0.1]} c={frame} />
      <Box p={[w / 2 + 0.05, 0, 0.05]} s={[0.1, h + 0.2, 0.1]} c={frame} />
      <Box p={[0, 0, 0.04]} s={[0.05, h, 0.05]} c={frame} />
      <Box p={[0, h * 0.1, 0.04]} s={[w, 0.05, 0.05]} c={frame} />
      {curtains && (
        <>
          <Box p={[0, h / 2 + 0.18, 0.14]} s={[w + 0.7, 0.04, 0.04]} c="#8a6a4a" />
          {[-1, 1].map((sd) => (
            <group key={sd} position={[sd * (w / 2 + 0.1), -0.05, 0.16]}>
              {[0, 1, 2, 3].map((i) => (
                <Cyl key={i} p={[sd * (i * 0.07 - 0.1), 0, 0]} args={[0.05, 0.06, h + 0.3, 10]} c="#f6efe2" rough={1} opacity={0.92} />
              ))}
            </group>
          ))}
        </>
      )}
    </group>
  )
}

// ---------- 문 (클릭하면 장면 전환) ----------
export function Door({ p, rotY = 0, to, label, color = '#8a5a3a', frame = '#5a3d2a', w = 1.0, h = 2.1, glass = false }) {
  const onClick = (e) => {
    e.stopPropagation()
    if (e.delta > 8) return
    goTo(to)
  }
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Box p={[-w / 2 - 0.06, h / 2, 0.03]} s={[0.12, h + 0.1, 0.12]} c={frame} />
      <Box p={[w / 2 + 0.06, h / 2, 0.03]} s={[0.12, h + 0.1, 0.12]} c={frame} />
      <Box p={[0, h + 0.05, 0.03]} s={[w + 0.24, 0.12, 0.12]} c={frame} />
      <group onClick={onClick} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        <Box p={[0, h / 2, 0.02]} s={[w, h, 0.06]} c={color} rough={0.7} />
        {glass ? (
          <>
            <Box p={[0, h * 0.62, 0.06]} s={[w * 0.72, h * 0.5, 0.02]} c="#cfe3ea" rough={0.1} emissive="#fff2cc" ei={0.25} />
            <Box p={[0, h * 0.62, 0.075]} s={[0.04, h * 0.5, 0.02]} c={color} />
            <Box p={[0, h * 0.62, 0.075]} s={[w * 0.72, 0.04, 0.02]} c={color} />
          </>
        ) : (
          <>
            <Box p={[0, h * 0.7, 0.055]} s={[w * 0.7, h * 0.35, 0.02]} c={color} rough={0.6} />
            <Box p={[0, h * 0.28, 0.055]} s={[w * 0.7, h * 0.35, 0.02]} c={color} rough={0.6} />
          </>
        )}
        <Sph p={[w * 0.38, h * 0.47, 0.08]} rad={0.045} c="#d9b45a" metal={0.6} rough={0.3} />
      </group>
      <Html position={[0, h + 0.45, 0.1]} center zIndexRange={[10, 0]}>
        <button className="door-tag" onClick={() => goTo(to)}>
          {label}
        </button>
      </Html>
    </group>
  )
}

export { Plant } from './Foliage'
