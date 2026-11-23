// 2D(xz 평면) 충돌 시스템: 사각형(AABB)과 원 충돌체에 대해 캐릭터(원)를 밀어냅니다.
const solids = new Set()

export function addSolid(s) {
  solids.add(s)
  return () => solids.delete(s)
}

export function getSolids() {
  return solids
}

export function rectSolid(x, z, w, d) {
  return { type: 'rect', minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 }
}

export function circleSolid(x, z, r) {
  return { type: 'circle', x, z, r }
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

/** pos(Vector3)를 반지름 r 의 원으로 보고 모든 충돌체 밖으로 밀어냅니다. */
export function resolveCollisions(pos, r, skip = null) {
  for (let iter = 0; iter < 5; iter++) {
    let moved = false
    for (const s of solids) {
      if (s === skip) continue
      if (s.type === 'circle') {
        let dx = pos.x - s.x
        let dz = pos.z - s.z
        let d = Math.hypot(dx, dz)
        const min = r + s.r
        if (d < min) {
          if (d < 1e-5) {
            dx = 1
            dz = 0
            d = 1
          }
          const push = min - d
          pos.x += (dx / d) * push
          pos.z += (dz / d) * push
          moved = true
        }
      } else {
        const cx = clamp(pos.x, s.minX, s.maxX)
        const cz = clamp(pos.z, s.minZ, s.maxZ)
        const dx = pos.x - cx
        const dz = pos.z - cz
        const d2 = dx * dx + dz * dz
        if (d2 < r * r) {
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2)
            const push = r - d
            pos.x += (dx / d) * push
            pos.z += (dz / d) * push
          } else {
            // 중심이 사각형 내부: 가장 얕은 방향으로 밀어냄
            const l = pos.x - s.minX
            const rr = s.maxX - pos.x
            const t = pos.z - s.minZ
            const b = s.maxZ - pos.z
            const m = Math.min(l, rr, t, b)
            if (m === l) pos.x = s.minX - r
            else if (m === rr) pos.x = s.maxX + r
            else if (m === t) pos.z = s.minZ - r
            else pos.z = s.maxZ + r
          }
          moved = true
        }
      }
    }
    if (!moved) break
  }
}
