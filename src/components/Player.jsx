import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Chibi, LOOKS } from './Chibi'
import { player, input, cam } from '../lib/shared'
import { resolveCollisions } from '../lib/collision'
import { useStore, getState, setState } from '../lib/store'
import { SCENES } from '../scenes/config'
import { setPose, standUp } from '../lib/actions'

const SPEED = 2.4

// 개발용: 주소 뒤에 ?dev 를 붙이면 콘솔에서 __dbg.tp(x, z) 로 순간이동할 수 있습니다.
if (typeof window !== 'undefined' && /[?&]dev/.test(window.location.search)) {
  window.__dbg = { player, cam, tp: (x, z) => ((player.seat = null), player.pos.set(x, 0, z)) }
}
const RADIUS = 0.27

function angleLerp(a, b, t) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

export default function Player() {
  const scene = useStore((s) => s.scene)
  const entry = useStore((s) => s.entry)
  const pose = useStore((s) => s.pose)
  const group = useRef()
  const anim = useRef({ walking: false })
  const marker = useRef()

  // 장면이 바뀌면 스폰 위치로 이동
  useEffect(() => {
    const cfg = SCENES[scene]
    const sp = cfg.spawns[entry] || cfg.spawns.start
    player.seat = null
    player.pos.set(sp.x, 0, sp.z)
    player.heading = sp.heading
    player.target = null
    cam.yaw = sp.yaw
  }, [scene, entry])

  useFrame((_, dtRaw) => {
    // 느린 기기에서도 실제 시간만큼 이동하되, 충돌 판정은 작은 단위로 나눠 처리(벽 뚫기 방지)
    const dtAll = Math.min(dtRaw, 0.25)
    const steps = Math.max(1, Math.ceil(dtAll / 0.035))
    const dt = dtAll / steps
    const k = input.keys
    let f = -input.joy.y
    let r = input.joy.x
    if (k.KeyW || k.ArrowUp) f += 1
    if (k.KeyS || k.ArrowDown) f -= 1
    if (k.KeyD || k.ArrowRight) r += 1
    if (k.KeyA || k.ArrowLeft) r -= 1
    let mx = 0
    let mz = 0
    const len = Math.hypot(f, r)
    const state = getState()
    if (len > 0.12) {
      const n = Math.min(1, len) / len
      f *= n
      r *= n
      // 카메라 기준 이동
      const fx = -Math.sin(cam.yaw)
      const fz = -Math.cos(cam.yaw)
      const rx = Math.cos(cam.yaw)
      const rz = -Math.sin(cam.yaw)
      mx = fx * f + rx * r
      mz = fz * f + rz * r
      player.target = null
      player.pendingPose = null
      if (state.pose !== 'stand') setState({ pose: 'stand' })
    } else if (player.target) {
      const dx = player.target.x - player.pos.x
      const dz = player.target.z - player.pos.z
      const d = Math.hypot(dx, dz)
      if (d < 0.08) {
        player.target = null
        if (player.pendingPose) {
          if (player.pendingHeading != null) player.heading = player.pendingHeading
          const pp = player.pendingPose
          player.pendingPose = null
          player.pendingHeading = null
          setPose(pp)
        }
      } else {
        const sp = Math.min(1, d / 0.3, d / (SPEED * dtAll))
        mx = (dx / d) * sp
        mz = (dz / d) * sp
        if (state.pose !== 'stand') setState({ pose: 'stand' })
      }
    }

    // 평상 등에 앉아 있는 동안: 자리 고정, 움직이면 일어나기
    if (player.seat) {
      if (Math.hypot(mx, mz) > 0.01 || player.target) {
        const tgt = player.target
        standUp()
        player.target = tgt
      } else {
        player.pos.set(player.seat.x, player.seat.y, player.seat.z)
        player.heading = player.seat.heading
        mx = 0
        mz = 0
      }
    }
    const moving = Math.hypot(mx, mz) > 0.01
    if (moving) {
      const before = player.pos.clone()
      for (let i = 0; i < steps; i++) {
        player.pos.x += mx * SPEED * dt
        player.pos.z += mz * SPEED * dt
        resolveCollisions(player.pos, RADIUS)
      }
      const actual = player.pos.distanceTo(before)
      const want = Math.hypot(mx, mz) * SPEED * dtAll
      // 목표 지점이 가구 안쪽이라 막히면 포기
      if (player.target && actual < want * 0.25) {
        player.stuckTime += dtAll
        if (player.stuckTime > 0.35) {
          player.target = null
          player.pendingPose = null
          player.stuckTime = 0
        }
      } else player.stuckTime = 0
      player.heading = angleLerp(player.heading, Math.atan2(mx, mz), Math.min(1, dtAll * 12))
    } else if (!player.seat) {
      resolveCollisions(player.pos, RADIUS)
    }
    player.walking = moving
    anim.current.walking = moving

    if (group.current) {
      group.current.position.copy(player.pos)
      group.current.rotation.y = player.heading
    }
    if (marker.current) {
      marker.current.visible = !!player.target
      if (player.target) {
        marker.current.position.set(player.target.x, 0.02, player.target.z)
        const s = 1 + Math.sin(performance.now() * 0.008) * 0.15
        marker.current.scale.set(s, s, s)
      }
    }

    // 근접 상호작용 지점 검사
    const cfg = SCENES[state.scene]
    const ids = []
    cfg.spots.forEach((s) => {
      if (Math.hypot(s.x - player.pos.x, s.z - player.pos.z) < s.r) ids.push(s.id)
    })
    cfg.npcs.forEach((n) => {
      if (Math.hypot(n.x - player.pos.x, n.z - player.pos.z) < n.r) ids.push('npc:' + n.id)
    })
    const key = ids.join(',')
    if (key !== state.near.join(',')) setState({ near: ids })
  })

  return (
    <>
      <group ref={group}>
        <Chibi look={LOOKS.me} pose={pose} animRef={anim} holding={pose === 'tea' ? 'tea' : undefined} />
      </group>
      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.16, 0.22, 28]} />
        <meshBasicMaterial color="#fff4d6" transparent opacity={0.85} />
      </mesh>
    </>
  )
}

