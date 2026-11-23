import React, { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox, Html } from '@react-three/drei'
import { addSolid, rectSolid, circleSolid } from '../lib/collision'
import { DEBUG, player, cam } from '../lib/shared'
import { getTex } from '../lib/textures'
import { goTo } from '../lib/actions'

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

// ---------- 벽돌 벽 (안쪽을 향한 평면) ----------
export function BrickWall({ w, h, p, r = [0, 0, 0], tint = '#ffffff' }) {
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
export function RoomShell({ w, d, h, floorTex = 'wood', floorRep, beams = 3 }) {
  const ceil = useMemo(() => getTex('woodDark', w / 3, d / 3), [w, d])
  const T = 0.6
  return (
    <group>
      <WalkFloor w={w} d={d} tex={floorTex} rep={floorRep || [w / 2.2, d / 2.2]} />
      {/* 앞벽 바깥 툇마루 (카메라가 앞쪽에서 볼 때 바닥이 허공처럼 보이지 않도록) */}
      <mesh position={[0, -0.04, d / 2 + 2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w + 6, 5]} />
        <meshStandardMaterial map={getTex('woodDark', (w + 6) / 2.2, 5 / 2.2)} color="#8a6a52" roughness={0.9} />
      </mesh>
      <Box p={[0, -0.02, d / 2 + 0.06]} s={[w, 0.08, 0.12]} c="#4a3324" cast={false} />
      {/* 천장 */}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={ceil} color="#d8c0a0" roughness={0.9} />
      </mesh>
      {Array.from({ length: beams }).map((_, i) => (
        <Box key={i} p={[0, h - 0.14, -d / 2 + ((i + 1) * d) / (beams + 1)]} s={[w, 0.24, 0.2]} c="#6b4a33" cast={false} />
      ))}
      <Box p={[0, h - 0.4, 0]} s={[0.24, 0.3, d]} c="#5e402c" cast={false} />
      {/* 벽 */}
      <BrickWall w={w} h={h} p={[0, h / 2, -d / 2]} />
      <BrickWall w={w} h={h} p={[0, h / 2, d / 2]} r={[0, Math.PI, 0]} />
      <BrickWall w={d} h={h} p={[-w / 2, h / 2, 0]} r={[0, Math.PI / 2, 0]} />
      <BrickWall w={d} h={h} p={[w / 2, h / 2, 0]} r={[0, -Math.PI / 2, 0]} />
      {/* 걸레받이 */}
      <Box p={[0, 0.07, -d / 2 + 0.02]} s={[w, 0.14, 0.04]} c="#5a3d2a" cast={false} />
      <Box p={[0, 0.07, d / 2 - 0.02]} s={[w, 0.14, 0.04]} c="#5a3d2a" cast={false} />
      <Box p={[-w / 2 + 0.02, 0.07, 0]} s={[0.04, 0.14, d]} c="#5a3d2a" cast={false} />
      <Box p={[w / 2 - 0.02, 0.07, 0]} s={[0.04, 0.14, d]} c="#5a3d2a" cast={false} />
      {/* 벽 충돌체 */}
      <Solid x={0} z={-d / 2 - T / 2} w={w + 2 * T} d={T} />
      <Solid x={0} z={d / 2 + T / 2} w={w + 2 * T} d={T} />
      <Solid x={-w / 2 - T / 2} z={0} w={T} d={d + 2 * T} />
      <Solid x={w / 2 + T / 2} z={0} w={T} d={d + 2 * T} />
    </group>
  )
}

// ---------- 창문 ----------
export function Window({ p, w = 1.6, h = 1.2, rotY = 0, view = 'landscape', curtains = true, frame = '#6b4a33', glow = 1 }) {
  const map = useMemo(() => getTex(view), [view])
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

// ---------- 화분 ----------
export function Plant({ p, s = 1, pot = '#b86a45', leaf = '#5f8f45', flowers }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.18, 0]} args={[0.2, 0.15, 0.36, 16]} c={pot} />
      <Cyl p={[0, 0.35, 0]} args={[0.18, 0.18, 0.03, 16]} c="#4a3426" />
      {[
        [0, 0.55, 0, 0.22],
        [0.12, 0.48, 0.05, 0.16],
        [-0.12, 0.5, -0.04, 0.17],
        [0.03, 0.72, -0.06, 0.15],
      ].map(([x, y, z, r], i) => (
        <Sph key={i} p={[x, y, z]} rad={r} c={leaf} seg={12} />
      ))}
      {flowers &&
        [
          [0.1, 0.66, 0.12],
          [-0.14, 0.62, 0.08],
          [0.0, 0.8, 0.05],
          [0.16, 0.55, -0.1],
        ].map(([x, y, z], i) => <Sph key={'f' + i} p={[x, y, z]} rad={0.08} c={flowers} seg={10} />)}
    </group>
  )
}
