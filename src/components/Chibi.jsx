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

// 마시멜로 질감: 아주 매트하면서 가장자리에 보송한 광택(sheen)이 도는 재질
function Mat({ c, map, rough = 0.95, side }) {
  return (
    <meshPhysicalMaterial
      color={c}
      map={map || null}
      roughness={rough}
      metalness={0}
      sheen={0.8}
      sheenRoughness={0.75}
      sheenColor="#fff4e8"
      side={side}
    />
  )
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
    // 앞머리 끝을 둥글게 말아 각진 단면이 보이지 않게
    parts.push(
      <mesh key="rim" position={[0, R * Math.cos(1.3), 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[R * Math.sin(1.3) - 0.008, 0.014, 10, 40, Math.PI]} />
        <Mat c={color} />
      </mesh>
    )
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
      <mesh key="rim" position={[0, R * 0.99 * Math.cos(1.18), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R * 0.99 * Math.sin(1.18) - 0.008, 0.014, 10, 40, Math.PI]} />
        <Mat c={color} />
      </mesh>
    )
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
    parts.push(
      <mesh key="rim" position={[0, R * 0.98 * Math.cos(1.08), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R * 0.98 * Math.sin(1.08) - 0.008, 0.014, 10, 40, Math.PI]} />
        <Mat c={color} />
      </mesh>
    )
  } else if (style === 'messy') {
    parts.push(cap(1.2, 'c', R))
    parts.push(back(1.85, 'b', R))
    parts.push(
      <mesh key="rim" position={[0, R * Math.cos(1.2), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R * Math.sin(1.2) - 0.008, 0.014, 10, 40, Math.PI]} />
        <Mat c={color} />
      </mesh>
    )
    // 뾰족한 삐침 대신 동글동글한 머리 뭉치
    ;[
      [0.07, 0.3, 0.12, 0.085],
      [-0.09, 0.3, 0.09, 0.08],
      [0.15, 0.25, -0.02, 0.075],
      [-0.03, 0.33, -0.06, 0.09],
    ].forEach(([x, y, z, r], i) =>
      parts.push(
        <mesh key={'t' + i} position={[x, y, z]} scale={[1, 0.75, 1]} castShadow>
          <sphereGeometry args={[r, 16, 12]} />
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
      case 'tea': {
        // 평상에 앉아 차 한 모금, 귤 한 입
        T.by = -0.17
        T.llx = T.lrx = -1.45 + Math.sin(t * 1.4) * 0.12
        const sip = (Math.sin(t * 0.9) + 1) / 2
        T.arx = -0.7 - sip * 1.35
        T.arz = -0.25 + sip * 0.15
        T.alx = -1.0 + Math.max(0, Math.sin(t * 0.9 + 2.4)) * -0.9
        T.alz = 0.25 - Math.max(0, Math.sin(t * 0.9 + 2.4)) * 0.25
        T.hx = -sip * 0.15
        break
      }
      case 'hug':
        T.alx = T.arx = -1.45 + Math.sin(t * 6) * 0.08
        T.alz = -0.45
        T.arz = 0.45
        T.hx = 0.2
        T.by = Math.abs(Math.sin(t * 8)) * 0.03
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

  const Arm = ({ side, refObj, prop }) => (
    <group ref={refObj} position={[side * 0.22, 0.47, 0]}>
      {prop}
      <mesh position={[0, -0.02, 0]} castShadow>
        <sphereGeometry args={[0.092, 20, 14]} />
        <Mat c={top} map={topMap} />
      </mesh>
      <mesh position={[0, -0.11, 0]} castShadow>
        <capsuleGeometry args={[0.078, 0.09, 8, 16]} />
        <Mat c={longSleeve ? top : SKIN} map={longSleeve ? topMap : null} />
      </mesh>
      <mesh position={[0, -0.215, 0]} castShadow>
        <sphereGeometry args={[0.082, 20, 14]} />
        <Mat c={SKIN} />
      </mesh>
    </group>
  )

  const Leg = ({ side, refObj }) => (
    <group ref={refObj} position={[side * 0.105, 0.18, 0]}>
      <mesh position={[0, -0.06, 0]} castShadow>
        <capsuleGeometry args={[0.092, 0.04, 8, 16]} />
        <Mat c={legs} />
      </mesh>
      <mesh position={[0, -0.135, 0.03]} scale={[1, 0.72, 1.2]} castShadow>
        <sphereGeometry args={[0.095, 20, 14]} />
        <Mat c={shoes} />
      </mesh>
    </group>
  )

  return (
    <group scale={look.scale || 1}>
      <group ref={body}>
        {/* 몸통 */}
        <mesh position={[0, 0.32, 0]} scale={[0.27, 0.255, 0.24]} castShadow receiveShadow>
          <sphereGeometry args={[1, 36, 24]} />
          <Mat c={top} map={topMap} />
        </mesh>
        {/* 반바지/바지 */}
        <mesh position={[0, 0.19, 0]} scale={[0.255, 0.14, 0.225]} castShadow>
          <sphereGeometry args={[1, 32, 20]} />
          <Mat c={bottom} />
        </mesh>
        {/* 조끼 (앞이 트인 껍질) */}
        {look.vest && (
          <mesh position={[0, 0.32, 0]} scale={[0.282, 0.268, 0.252]} castShadow>
            <sphereGeometry args={[1, 28, 18, Math.PI / 2 + 0.38, Math.PI * 2 - 0.76, 0.55, 1.9]} />
            <Mat c={look.vest} map={vestMap} side={THREE.DoubleSide} />
          </mesh>
        )}
        {/* 앞치마 */}
        {look.apron && (
          <group>
            <mesh position={[0, 0.3, 0]} scale={[0.283, 0.27, 0.255]}>
              <sphereGeometry args={[1, 32, 20, Math.PI / 2 - 0.95, 1.9, 1.0, 1.75]} />
              <Mat c="#ffffff" map={apronMap} side={THREE.DoubleSide} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.1, 0.5, 0.12]} rotation={[0.6, 0, 0]}>
                <capsuleGeometry args={[0.015, 0.07, 6, 10]} />
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
              <mesh key={s} position={[s * 0.05, 0.45, 0.225]}>
                <capsuleGeometry args={[0.012, 0.08, 6, 8]} />
                <Mat c="#ffffff" />
              </mesh>
            ))}
            <mesh position={[0, 0.24, 0.205]} rotation={[-0.3, 0, 0]} scale={[1, 0.45, 0.22]}>
              <sphereGeometry args={[0.13, 20, 14]} />
              <Mat c={look.hood} />
            </mesh>
          </group>
        )}
        {Arm({
          side: 1,
          refObj: armL,
          prop: holding === 'tea' && (
            <group position={[-0.02, -0.29, 0.03]}>
              <mesh castShadow>
                <sphereGeometry args={[0.055, 14, 10]} />
                <meshStandardMaterial color="#f08a24" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.012, 0.01, 0.01, 6]} />
                <meshStandardMaterial color="#4f6b2c" />
              </mesh>
            </group>
          ),
        })}
        {Arm({
          side: -1,
          refObj: armR,
          prop: holding === 'tea' && (
            <group position={[0.02, -0.3, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.055, 0.04, 0.09, 16]} />
                <meshStandardMaterial color="#f4efe4" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.05, 16]} />
                <meshStandardMaterial color="#9a6a2a" roughness={0.2} />
              </mesh>
            </group>
          ),
        })}
        {Leg({ side: 1, refObj: legL })}
        {Leg({ side: -1, refObj: legR })}
        {holding === 'game' && (
          <group position={[0, 0.3, 0.27]} rotation={[-0.6, 0, 0]}>
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.045, 0.13, 8, 12]} />
              <Mat c="#3b7bd6" rough={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.047]}>
              <planeGeometry args={[0.09, 0.05]} />
              <meshBasicMaterial color="#9ff0c8" toneMapped={false} />
            </mesh>
          </group>
        )}

        {/* 머리 */}
        <group ref={head} position={[0, 0.5, 0]}>
          <group position={[0, 0.27, 0]} scale={[1.05, 0.97, 1.02]}>
            <mesh castShadow>
              <sphereGeometry args={[HEAD_R, 48, 32]} />
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
