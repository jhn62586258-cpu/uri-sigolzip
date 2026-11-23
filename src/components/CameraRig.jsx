import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { cam, player } from '../lib/shared'
import { useStore } from '../lib/store'
import { SCENES } from '../scenes/config'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/**
 * 3인칭 추적 카메라
 *  · 한 손가락/마우스 드래그: 둘러보기 (회전)
 *  · 두 손가락 핀치: 부드러운 확대/축소
 *  · 마우스 휠: 확대/축소
 */
export default function CameraRig() {
  const { camera, gl } = useThree()
  const scene = useStore((s) => s.scene)
  const pose = useStore((s) => s.pose)
  const look = useRef(new THREE.Vector3())

  useEffect(() => {
    const c = SCENES[scene].camera
    cam.minDist = c.minDist
    cam.maxDist = c.maxDist
    cam.dist = cam.targetDist = c.dist
    cam.pitch = c.pitch
    camera.fov = c.fov
    camera.near = 0.05
    camera.far = 400
    camera.updateProjectionMatrix()
    look.current.set(player.pos.x, cam.focusY, player.pos.z)
  }, [scene, camera])

  useEffect(() => {
    const el = gl.domElement
    const pts = new Map()
    let pinchDist = 0
    let moved = 0

    const down = (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 1) moved = 0
      if (pts.size === 2) {
        const [a, b] = [...pts.values()]
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
        cam.lastPinch = performance.now()
      }
    }
    const move = (e) => {
      const p = pts.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x
      const dy = e.clientY - p.y
      p.x = e.clientX
      p.y = e.clientY
      if (pts.size === 1) {
        moved += Math.abs(dx) + Math.abs(dy)
        if (moved > 5) {
          cam.yaw -= dx * 0.0065
          cam.pitch = clamp(cam.pitch + dy * 0.0045, 0.06, 1.3)
          cam.dragging = true
        }
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinchDist > 0 && d > 0) {
          // 손가락을 벌리면(d 증가) 거리 감소 → 확대
          cam.targetDist = clamp(cam.targetDist * Math.pow(pinchDist / d, 1.15), cam.minDist, cam.maxDist)
        }
        pinchDist = d
        cam.lastPinch = performance.now()
      }
    }
    const up = (e) => {
      pts.delete(e.pointerId)
      if (pts.size < 2) pinchDist = 0
      if (pts.size === 0) {
        cam.dragging = false
        cam.lastDrag = performance.now()
      }
    }
    const wheel = (e) => {
      e.preventDefault()
      cam.targetDist = clamp(cam.targetDist * Math.exp(e.deltaY * 0.0012), cam.minDist, cam.maxDist)
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    // 세로 화면(스마트폰)에서는 시야각을 넓혀 답답하지 않게
    const baseFov = SCENES[scene].camera.fov
    const wantFov = camera.aspect < 1 ? Math.min(82, baseFov * 1.28) : baseFov
    if (Math.abs(camera.fov - wantFov) > 0.01) {
      camera.fov = wantFov
      camera.updateProjectionMatrix()
    }
    cam.dist = THREE.MathUtils.damp(cam.dist, cam.targetDist, 9, dt)
    const fy = pose === 'prone' ? 0.42 : pose === 'sit' ? 0.55 : cam.focusY
    const tx = player.pos.x
    const tz = player.pos.z
    look.current.x = THREE.MathUtils.damp(look.current.x, tx, 8, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, fy, 6, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, tz, 8, dt)
    const cp = Math.cos(cam.pitch)
    const dir = [Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp]
    let dist = cam.dist
    // 실내: 카메라가 벽/천장 밖으로 나가지 않게 시선 방향을 유지한 채 거리만 줄임
    const b = SCENES[scene].bounds
    if (b) {
      const o = [look.current.x, look.current.y, look.current.z]
      const lo = [b.minX, -Infinity, b.minZ]
      const hi = [b.maxX, b.maxY, b.maxZ]
      for (let i = 0; i < 3; i++) {
        if (Math.abs(dir[i]) < 1e-5) continue
        const lim = dir[i] > 0 ? hi[i] : lo[i]
        const t = (lim - o[i]) / dir[i]
        if (t >= 0 && t < dist) dist = Math.max(0.6, t)
      }
    }
    camera.position.set(look.current.x + dir[0] * dist, look.current.y + dir[1] * dist, look.current.z + dir[2] * dist)
    camera.lookAt(look.current)
  })

  return null
}
