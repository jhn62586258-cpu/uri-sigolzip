import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getFaceTex, getTex } from '../lib/textures'

// =============================================================
//  '온라인 산사' 감성의 2등신 캐릭터
//  · 큰 머리(전체 키의 약 57%), 짧고 통통한 팔다리
//  · 보들보들한 매트 질감(roughness 높음)
//  · 얼굴은 캔버스 텍스처를 머리 앞쪽 곡면에 입힘 (^ ^ 눈웃음 + 볼터치 + 작은 미소)
// =============================================================

const HEAD_R = 0.31
const SKIN = '#ffdcc4'

const damp = THREE.MathUtils.damp

function Mat({ c, map, rough = 0.92, side }) {
  return <meshStandardMaterial color={c} map={map || null} roughness={rough} metalness={0} side={side} />
}

function Hair({ style, color }) {
  const R = HEAD_R * 1.07
  const parts = []
  const cap = (thetaLen, key, r = R) => (
    <mesh key={key} castShadow>
      <sphereGeometry args={[r, 32, 20, 0, Math.PI * 2, 0, thetaLen]} />
      <Mat c={color} />
    </mesh>
  )
  const back = (thetaLen, key, r = R) => (
    <mesh key={key} castShadow>
      <sphereGeometry args={[r, 32, 20, Math.PI * 0.98, Math.PI * 1.04, 0, thetaLen]} />
      <Mat c={color} side={THREE.DoubleSide} />
    </mesh>
  )
  if (style === 'bowl') {
    // 바가지 머리: 이마 위에서 반듯하게 잘린 앞머리 + 귀 아래까지 덮는 뒷머리
    parts.push(cap(1.3, 'c'))
    parts.push(back(2.05, 'b'))
    // 옆머리: 얼굴 패치 양옆만 덮어 귀 아래까지 내려오는 바가지 실루엣
    ;[[0, Math.PI / 2 - 0.78], [Math.PI / 2 + 0.78, Math.PI / 2 - 0.78]].forEach(([ps, pl], i) =>
      parts.push(
        <mesh key={'s' + i} castShadow>
          <sphereGeometry args={[R * 0.998, 24, 20, ps, pl, 0, 1.98]} />
          <Mat c={color} side={THREE.DoubleSide} />
        </mesh>
      )
    )
  } else if (style === 'bun') {
    parts.push(cap(1.18, 'c', R * 0.99))
    parts.push(back(1.9, 'b', R * 0.99))
    parts.push(
      <mesh key="bun" position={[0, 0.2, -0.24]} castShadow>
        <sphereGeometry args={[0.13, 20, 14]} />
        <Mat c={color} />
      </mesh>
    )
    parts.push(
      <mesh key="tie" position={[0, 0.16, -0.21]} rotation={[0.9, 0, 0]}>
        <torusGeometry args={[0.08, 0.025, 8, 20]} />
        <Mat c="#e0705f" />
      </mesh>
    )
  } else if (style === 'short') {
    parts.push(cap(1.08, 'c', R * 0.98))
    parts.push(back(1.75, 'b', R * 0.98))
  } else if (style === 'messy') {
    parts.push(cap(1.2, 'c', R))
    parts.push(back(1.85, 'b', R))
    ;[
      [0.06, 0.33, 0.12, 0.3],
      [-0.1, 0.32, 0.08, -0.4],
      [0.15, 0.27, -0.02, 0.8],
      [-0.02, 0.35, -0.08, 0.1],
      [0.0, 0.25, 0.25, 0.2],
    ].forEach(([x, y, z, rz], i) =>
      parts.push(
        <mesh key={'t' + i} position={[x, y, z]} rotation={[0.4, 0, rz]} castShadow>
          <coneGeometry args={[0.06, 0.14, 8]} />
          <Mat c={color} />
        </mesh>
      )
    )
  } else if (style === 'pigtails') {
    parts.push(cap(1.3, 'c'))
    parts.push(back(1.9, 'b'))
    ;[-1, 1].forEach((s) =>
      parts.push(
        <mesh key={'p' + s} position={[s * 0.3, -0.02, -0.08]} castShadow>
          <sphereGeometry args={[0.11, 16, 12]} />
          <Mat c={color} />
        </mesh>
      )
    )
  }
  return <group>{parts}</group>
}

/**
 * look: { hair, hairColor, top, topMap, sleeve:'short'|'long', bottom, legs, shoes, face:{...}, glasses, apron, vest, hood, scale }
 * pose: 'stand' | 'sit' | 'sitChair' | 'prone' | 'cook' | 'game'
 * animRef: { current: { walking: bool } } (주인공 전용)
 */
export function Chibi({ look, pose = 'stand', animRef, talking = false, seed = 0, holding }) {
  const faceTex = useMemo(() => getFaceTex(look.face || {}), [JSON.stringify(look.face || {})])
  const topMap = useMemo(() => (look.topMap ? getTex(look.topMap, 2, 2) : null), [look.topMap])
  const apronMap = useMemo(() => (look.apron ? getTex('floral', 1, 1) : null), [look.apron])
  const vestMap = useMemo(() => (look.vest ? getTex('knitOlive', 3, 3) : null), [look.vest])

  const body = useRef()
  const head = useRef()
  const armL = useRef()
  const armR = useRef()
  const legL = useRef()
  const legR = useRef()
  const cur = useRef({ by: 0, bz: 0, brx: 0, hx: 0, hz: 0, hy: 0, alx: 0, arx: 0, alz: 0.18, arz: -0.18, llx: 0, lrx: 0 })

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const t = state.clock.elapsedTime + seed
    const walking = animRef?.current?.walking
    const T = { by: 0, bz: 0, brx: 0, hx: 0, hz: Math.sin(t * 1.3) * 0.04, hy: 0, alx: 0, arx: 0, alz: 0.18, arz: -0.18, llx: 0, lrx: 0 }
    const breathe = Math.sin(t * 2.2) * 0.012

    switch (pose) {
      case 'sit':
        T.by = -0.17
        T.llx = T.lrx = -1.45
        T.alx = T.arx = -0.45
        T.alz = 0.4
        T.arz = -0.4
        T.hz = Math.sin(t * 1.1) * 0.08
        break
      case 'sitChair':
        T.llx = -1.2 + Math.sin(t * 1.5) * 0.08
        T.lrx = -1.2 - Math.sin(t * 1.5) * 0.08
        T.alx = T.arx = -0.35
        T.alz = 0.35
        T.arz = -0.35
        break
      case 'prone':
        T.brx = Math.PI / 2
        T.by = 0.2
        T.bz = -0.42
        T.hx = -0.9
        T.llx = 0.7 + Math.sin(t * 4) * 0.45
        T.lrx = 0.7 + Math.sin(t * 4 + Math.PI) * 0.45
        T.alx = T.arx = -2.7
        T.alz = 0.5
        T.arz = -0.5
        T.hz = Math.sin(t * 1.6) * 0.1
        break
      case 'cook':
        T.arx = -1.15 + Math.sin(t * 4) * 0.12
        T.arz = -0.15 + Math.cos(t * 4) * 0.22
        T.alx = -0.55
        T.alz = 0.25
        T.hx = 0.18
        T.hz = Math.sin(t * 1.7) * 0.07
        break
      case 'game':
        T.by = -0.17
        T.llx = T.lrx = -1.45
        T.alx = T.arx = -1.15 + Math.sin(t * 14) * 0.03
        T.alz = -0.3
        T.arz = 0.3
        T.hx = 0.32
        break
      default:
        if (walking) {
          const w = t * 11
          T.llx = Math.sin(w) * 0.6
          T.lrx = -Math.sin(w) * 0.6
          T.alx = -Math.sin(w) * 0.55
          T.arx = Math.sin(w) * 0.55
          T.by = Math.abs(Math.sin(w)) * 0.04
          T.hz = Math.sin(w) * 0.05
        }
    }
    if (talking) {
      T.hx += Math.sin(t * 9) * 0.06
      if (pose === 'stand') {
        T.arx = -2.5 + Math.sin(t * 8) * 0.25
        T.arz = -0.35
      }
    }

    const c = cur.current
    const k = 10
    for (const key in T) c[key] = damp(c[key], T[key], k, dt)

    if (body.current) {
      body.current.position.y = c.by
      body.current.position.z = c.bz
      body.current.rotation.x = c.brx
    }
    if (head.current) {
      head.current.rotation.x = c.hx
      head.current.rotation.z = c.hz
      head.current.position.y = 0.5 + breathe
    }
    if (armL.current) armL.current.rotation.set(c.alx, 0, c.alz)
    if (armR.current) armR.current.rotation.set(c.arx, 0, c.arz)
    if (legL.current) legL.current.rotation.x = c.llx
    if (legR.current) legR.current.rotation.x = c.lrx
  })

  const top = look.top || '#f4efe4'
  const bottom = look.bottom || '#4a3a33'
  const legs = look.legs || SKIN
  const shoes = look.shoes || '#ffffff'
  const longSleeve = look.sleeve === 'long'

  const Arm = ({ side, refObj }) => (
    <group ref={refObj} position={[side * 0.22, 0.47, 0]}>
      <mesh position={[0, -0.02, 0]} castShadow>
        <sphereGeometry args={[0.085, 16, 12]} />
        <Mat c={top} map={topMap} />
      </mesh>
      <mesh position={[0, -0.12, 0]} castShadow>
        <capsuleGeometry args={[0.068, 0.12, 6, 12]} />
        <Mat c={longSleeve ? top : SKIN} map={longSleeve ? topMap : null} />
      </mesh>
      <mesh position={[0, -0.23, 0]} castShadow>
        <sphereGeometry args={[0.072, 14, 10]} />
        <Mat c={SKIN} />
      </mesh>
    </group>
  )

  const Leg = ({ side, refObj }) => (
    <group ref={refObj} position={[side * 0.105, 0.18, 0]}>
      <mesh position={[0, -0.06, 0]} castShadow>
        <capsuleGeometry args={[0.082, 0.06, 6, 12]} />
        <Mat c={legs} />
      </mesh>
      <mesh position={[0, -0.14, 0.03]} scale={[1, 0.65, 1.3]} castShadow>
        <sphereGeometry args={[0.085, 14, 10]} />
        <Mat c={shoes} />
      </mesh>
    </group>
  )

  return (
    <group scale={look.scale || 1}>
      <group ref={body}>
        {/* 몸통 */}
        <mesh position={[0, 0.33, 0]} scale={[0.25, 0.24, 0.215]} castShadow receiveShadow>
          <sphereGeometry args={[1, 28, 20]} />
          <Mat c={top} map={topMap} />
        </mesh>
        {/* 반바지/바지 */}
        <mesh position={[0, 0.2, 0]} scale={[0.235, 0.13, 0.205]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <Mat c={bottom} />
        </mesh>
        {/* 조끼 (앞이 트인 껍질) */}
        {look.vest && (
          <mesh position={[0, 0.33, 0]} scale={[0.265, 0.255, 0.23]} castShadow>
            <sphereGeometry args={[1, 28, 18, Math.PI / 2 + 0.38, Math.PI * 2 - 0.76, 0.55, 1.9]} />
            <Mat c={look.vest} map={vestMap} side={THREE.DoubleSide} />
          </mesh>
        )}
        {/* 앞치마 */}
        {look.apron && (
          <group>
            <mesh position={[0, 0.27, 0]} scale={[1, 1, 0.92]}>
              <cylinderGeometry args={[0.235, 0.27, 0.36, 20, 1, true, -0.95, 1.9]} />
              <Mat c="#ffffff" map={apronMap} side={THREE.DoubleSide} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.1, 0.49, 0.1]} rotation={[0.5, 0, 0]}>
                <boxGeometry args={[0.04, 0.12, 0.01]} />
                <Mat c="#f3d7d0" />
              </mesh>
            ))}
          </group>
        )}
        {/* 후드티: 모자 + 끈 + 주머니 */}
        {look.hood && (
          <group>
            <mesh position={[0, 0.56, -0.13]} rotation={[1.2, 0, 0]} castShadow>
              <torusGeometry args={[0.15, 0.065, 10, 20]} />
              <Mat c={look.hood} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.05, 0.47, 0.2]}>
                <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
                <Mat c="#ffffff" />
              </mesh>
            ))}
            <mesh position={[0, 0.25, 0.19]} rotation={[-0.25, 0, 0]}>
              <boxGeometry args={[0.24, 0.09, 0.03]} />
              <Mat c={look.hood} />
            </mesh>
          </group>
        )}
        {Arm({ side: 1, refObj: armL })}
        {Arm({ side: -1, refObj: armR })}
        {Leg({ side: 1, refObj: legL })}
        {Leg({ side: -1, refObj: legR })}
        {holding === 'game' && (
          <group position={[0, 0.3, 0.27]} rotation={[-0.6, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.1, 0.03]} />
              <Mat c="#3b7bd6" rough={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.017]}>
              <planeGeometry args={[0.1, 0.07]} />
              <meshBasicMaterial color="#9ff0c8" toneMapped={false} />
            </mesh>
          </group>
        )}

        {/* 머리 */}
        <group ref={head} position={[0, 0.5, 0]}>
          <group position={[0, 0.27, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[HEAD_R, 40, 28]} />
              <Mat c={SKIN} />
            </mesh>
            {/* 얼굴 (머리 앞쪽 곡면 패치) */}
            <mesh renderOrder={2}>
              <sphereGeometry args={[HEAD_R * 1.006, 40, 28, Math.PI / 2 - 0.85, 1.7, 0.95, 1.2]} />
              <meshStandardMaterial map={faceTex} transparent depthWrite={false} roughness={0.95} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
            {/* 귀 */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * HEAD_R * 0.97, -0.02, 0]} scale={[0.6, 1, 0.8]}>
                <sphereGeometry args={[0.06, 12, 10]} />
                <Mat c={SKIN} />
              </mesh>
            ))}
            <Hair style={look.hair} color={look.hairColor || '#3a2a22'} />
            {look.glasses && (
              <group position={[0, -0.005, HEAD_R * 0.97]}>
                {[-1, 1].map((s) => (
                  <mesh key={s} position={[s * 0.1, 0, 0]}>
                    <torusGeometry args={[0.062, 0.009, 8, 24]} />
                    <meshStandardMaterial color="#3a2a20" roughness={0.4} metalness={0.3} />
                  </mesh>
                ))}
                <mesh position={[0, 0.01, 0.005]}>
                  <boxGeometry args={[0.07, 0.012, 0.01]} />
                  <meshStandardMaterial color="#3a2a20" />
                </mesh>
                {[-1, 1].map((s) => (
                  <mesh key={'a' + s} position={[s * 0.19, 0.01, -0.13]} rotation={[0, s * 0.35, 0]}>
                    <boxGeometry args={[0.01, 0.012, 0.26]} />
                    <meshStandardMaterial color="#3a2a20" />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  )
}

// ---------- 가족 외형 프리셋 ----------
export const LOOKS = {
  me: {
    hair: 'bowl',
    hairColor: '#3a2820',
    top: '#fbf5ea',
    sleeve: 'short',
    bottom: '#5a4238',
    shoes: '#fff7ee',
    face: { eyes: 'smile', mouth: 'smile', lashes: true },
  },
  mom: {
    hair: 'bun',
    hairColor: '#2e211c',
    top: '#d98f7e',
    topMap: 'knitRose',
    sleeve: 'long',
    bottom: '#6d5a4c',
    legs: '#6d5a4c',
    shoes: '#f0e6da',
    apron: true,
    face: { eyes: 'smile', mouth: 'smile', lashes: true, blush: 'rgba(255,120,120,0.8)' },
    scale: 1.12,
  },
  dad: {
    hair: 'short',
    hairColor: '#2a211c',
    top: '#e8dfcc',
    sleeve: 'long',
    bottom: '#4f5866',
    legs: '#4f5866',
    shoes: '#5a4a40',
    vest: '#7d7a4e',
    glasses: true,
    face: { eyes: 'smile', mouth: 'smile', brows: 'soft' },
    scale: 1.16,
  },
  brother: {
    hair: 'messy',
    hairColor: '#2b201b',
    top: '#7f9bbd',
    sleeve: 'long',
    bottom: '#3f4450',
    legs: '#3f4450',
    shoes: '#ffffff',
    hood: '#7392b8',
    face: { eyes: 'half', mouth: 'smirk', brows: 'flat', blush: 'rgba(255,140,140,0.45)' },
    scale: 1.06,
  },
}
