import * as THREE from 'three'

// =============================================================
//  절차적 캔버스 텍스처 모음 (이미지 파일 없이 모두 코드로 그림)
// =============================================================

export function rng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const canvasCache = new Map()
const texCache = new Map()

function canvas(key, w, h, draw) {
  if (canvasCache.has(key)) return canvasCache.get(key)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  draw(g, w, h)
  canvasCache.set(key, c)
  return c
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

// ---------------- 벽돌 (옅은 고동색) ----------------
function drawBrick(g, w, h, bump) {
  const r = rng(11)
  const rows = 8
  const bh = h / rows
  const bw = w / 4
  const gap = 7
  g.fillStyle = bump ? '#2a2a2a' : '#e6d6bd'
  g.fillRect(0, 0, w, h)
  // 줄눈(모르타르) 질감
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = bump ? `rgba(90,90,90,${r() * 0.5})` : `rgba(130,105,80,${r() * 0.16})`
    g.fillRect(r() * w, r() * h, 2, 2)
  }
  for (let row = 0; row < rows; row++) {
    const y = row * bh
    const off = row % 2 ? bw / 2 : 0
    for (let col = 0; col < 4; col++) {
      const hue = 20 + r() * 10
      const sat = 30 + r() * 16
      const lit = 52 + r() * 13
      const specks = []
      for (let k = 0; k < 70; k++) specks.push([r(), r(), r(), r() < 0.5])
      const shade = r()
      const xs = [col * bw + off]
      if (xs[0] + bw > w) xs.push(xs[0] - w)
      xs.forEach((x) => {
        const bx = x + gap / 2
        const by = y + gap / 2
        const ww = bw - gap
        const hh = bh - gap
        roundRect(g, bx, by, ww, hh, 5)
        if (bump) {
          g.fillStyle = `rgb(${200 + shade * 40},${200 + shade * 40},${200 + shade * 40})`
          g.fill()
        } else {
          g.fillStyle = `hsl(${hue},${sat}%,${lit}%)`
          g.fill()
          const grad = g.createLinearGradient(0, by, 0, by + hh)
          grad.addColorStop(0, 'rgba(255,240,220,0.18)')
          grad.addColorStop(1, 'rgba(70,40,20,0.16)')
          g.fillStyle = grad
          g.fill()
        }
        specks.forEach(([sx, sy, a, dark]) => {
          g.fillStyle = bump
            ? `rgba(${dark ? 120 : 255},${dark ? 120 : 255},${dark ? 120 : 255},${a * 0.6})`
            : dark
            ? `rgba(90,55,30,${a * 0.25})`
            : `rgba(255,235,210,${a * 0.25})`
          g.fillRect(bx + 3 + sx * (ww - 6), by + 3 + sy * (hh - 6), 2 + a * 3, 2 + a * 2)
        })
      })
    }
  }
}

// ---------------- 나무 바닥 ----------------
function drawWood(g, w, h, opts) {
  const r = rng(opts.seed || 3)
  const rows = opts.rows || 8
  const ph = h / rows
  for (let row = 0; row < rows; row++) {
    let x = -r() * 200
    while (x < w) {
      const len = 180 + r() * 220
      const l = (opts.light || 40) + r() * 9
      g.fillStyle = `hsl(${opts.hue || 28},${opts.sat || 42}%,${l}%)`
      g.fillRect(x, row * ph, len, ph)
      // 나뭇결
      for (let k = 0; k < 9; k++) {
        g.strokeStyle = `rgba(60,30,10,${0.06 + r() * 0.1})`
        g.lineWidth = 1 + r() * 1.5
        g.beginPath()
        const yy = row * ph + 4 + r() * (ph - 8)
        g.moveTo(x, yy)
        for (let s = 0; s <= 8; s++) g.lineTo(x + (len * s) / 8, yy + Math.sin(s + k) * 2 * r())
        g.stroke()
      }
      // 옹이
      if (r() < 0.25) {
        g.fillStyle = 'rgba(70,35,15,0.25)'
        g.beginPath()
        g.ellipse(x + r() * len, row * ph + ph / 2, 8 + r() * 6, 4, 0, 0, Math.PI * 2)
        g.fill()
      }
      g.fillStyle = 'rgba(40,20,8,0.55)'
      g.fillRect(x, row * ph, 2, ph)
      x += len
    }
    g.fillStyle = 'rgba(40,20,8,0.5)'
    g.fillRect(0, row * ph, w, 2)
  }
}

// ---------------- 체크 / 타탄 ----------------
function drawPlaid(g, w, h, [base, c1, c2, c3]) {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  const stripe = (pos, size, color, alpha) => {
    g.globalAlpha = alpha
    g.fillStyle = color
    g.fillRect(pos, 0, size, h)
    g.fillRect(0, pos, w, size)
    g.globalAlpha = 1
  }
  for (let i = 0; i < 2; i++) {
    const o = i * (w / 2)
    stripe(o + 10, 70, c1, 0.55)
    stripe(o + 100, 16, c2, 0.6)
    stripe(o + 130, 6, c3, 0.7)
    stripe(o + 180, 30, c1, 0.4)
  }
  // 직조 느낌
  g.globalAlpha = 0.08
  g.fillStyle = '#000'
  for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1)
  g.globalAlpha = 1
}

// ---------------- 잔디 ----------------
function drawGrass(g, w, h) {
  const r = rng(5)
  g.fillStyle = '#7f9a4c'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(${95 + r() * 60},${120 + r() * 45},${45 + r() * 25},0.35)`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 10 + r() * 30, 6 + r() * 20, r() * 3, 0, Math.PI * 2)
    g.fill()
  }
  for (let i = 0; i < 4200; i++) {
    const x = r() * w
    const y = r() * h
    g.strokeStyle = `hsl(${62 + r() * 28},${34 + r() * 20}%,${30 + r() * 26}%)`
    g.lineWidth = 1 + r()
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (r() - 0.5) * 4, y - 4 - r() * 7)
    g.stroke()
  }
}

// ---------------- 돌담 ----------------
function drawStone(g, w, h) {
  const r = rng(9)
  g.fillStyle = '#6f675b'
  g.fillRect(0, 0, w, h)
  let y = 0
  while (y < h) {
    const rowH = 40 + r() * 26
    let x = -r() * 40
    while (x < w + 40) {
      const sw = 50 + r() * 60
      const l = 55 + r() * 18
      g.fillStyle = `hsl(${30 + r() * 15},${8 + r() * 10}%,${l}%)`
      g.beginPath()
      g.ellipse(x + sw / 2, y + rowH / 2, sw / 2 - 3, rowH / 2 - 3, (r() - 0.5) * 0.3, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.12)'
      g.beginPath()
      g.ellipse(x + sw / 2 - 6, y + rowH / 2 - 6, sw / 3, rowH / 4, 0, 0, Math.PI * 2)
      g.fill()
      x += sw
    }
    y += rowH - 4
  }
}

// ---------------- 풍경 (창밖/TV/모니터) ----------------
function drawLandscape(g, w, h, opts = {}) {
  const sky = g.createLinearGradient(0, 0, 0, h * 0.65)
  sky.addColorStop(0, opts.top || '#9cc6ea')
  sky.addColorStop(1, opts.bottom || '#f6ead2')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  const r = rng(opts.seed || 21)
  g.fillStyle = 'rgba(255,255,255,0.85)'
  for (let i = 0; i < 6; i++) {
    const cx = r() * w
    const cy = r() * h * 0.3 + 10
    for (let k = 0; k < 4; k++) {
      g.beginPath()
      g.ellipse(cx + k * 18, cy + (k % 2) * 5, 22 + r() * 10, 10 + r() * 5, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
  const hill = (base, amp, color, seed) => {
    const rr = rng(seed)
    g.fillStyle = color
    g.beginPath()
    g.moveTo(0, h)
    for (let x = 0; x <= w; x += 8) {
      g.lineTo(x, base + Math.sin(x * 0.012 + seed) * amp + Math.sin(x * 0.031 + rr() * 0.2) * amp * 0.4)
    }
    g.lineTo(w, h)
    g.fill()
  }
  hill(h * 0.42, 22, '#7d9fa0', 3)
  hill(h * 0.52, 18, '#5f8a57', 7)
  hill(h * 0.66, 12, '#7aa84e', 13)
  g.fillStyle = '#a9c96a'
  g.fillRect(0, h * 0.8, w, h * 0.2)
  g.strokeStyle = 'rgba(80,120,40,0.4)'
  for (let y = h * 0.82; y < h; y += 7) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(w, y + 4)
    g.stroke()
  }
}

// ---------------- 얼굴 (반달 눈웃음 + 볼터치 + 작은 미소) ----------------
function drawFace(g, w, h, opts) {
  g.clearRect(0, 0, w, h)
  const cx = w / 2
  const eyeY = h * 0.525
  const eyeDX = w * 0.195
  const line = opts.line || '#4a2e22'
  // 볼터치
  ;[-1, 1].forEach((s) => {
    const bx = cx + s * w * 0.3
    const by = h * 0.64
    const grd = g.createRadialGradient(bx, by, 2, bx, by, w * 0.085)
    grd.addColorStop(0, opts.blush || 'rgba(255,128,128,0.75)')
    grd.addColorStop(1, 'rgba(255,140,140,0)')
    g.fillStyle = grd
    g.beginPath()
    g.ellipse(bx, by, w * 0.095, w * 0.065, 0, 0, Math.PI * 2)
    g.fill()
  })
  g.strokeStyle = line
  g.fillStyle = line
  g.lineCap = 'round'
  g.lineJoin = 'round'
  // 눈썹
  if (opts.brows) {
    g.lineWidth = w * 0.018
    ;[-1, 1].forEach((s) => {
      g.beginPath()
      g.moveTo(cx + s * eyeDX - w * 0.05, eyeY - h * 0.1 + (opts.brows === 'flat' ? 0 : 3))
      g.quadraticCurveTo(cx + s * eyeDX, eyeY - h * 0.125, cx + s * eyeDX + w * 0.05, eyeY - h * 0.1 + (opts.brows === 'flat' ? 0 : 3))
      g.stroke()
    })
  }
  // 눈
  g.lineWidth = w * 0.026
  ;[-1, 1].forEach((s) => {
    const ex = cx + s * eyeDX
    if (opts.eyes === 'dot') {
      g.beginPath()
      g.ellipse(ex, eyeY, w * 0.028, w * 0.036, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#fff'
      g.beginPath()
      g.arc(ex + w * 0.01, eyeY - w * 0.012, w * 0.009, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = line
    } else if (opts.eyes === 'half') {
      // 심드렁한 반쯤 감은 눈
      g.beginPath()
      g.moveTo(ex - w * 0.05, eyeY)
      g.lineTo(ex + w * 0.05, eyeY)
      g.stroke()
      g.beginPath()
      g.arc(ex, eyeY + 1, w * 0.026, 0, Math.PI)
      g.fill()
    } else {
      // ^ ^ 반달 눈웃음
      g.beginPath()
      g.arc(ex, eyeY + h * 0.025, w * 0.052, Math.PI * 1.15, Math.PI * 1.85)
      g.stroke()
    }
    if (opts.lashes) {
      g.lineWidth = w * 0.012
      g.beginPath()
      g.moveTo(ex + s * w * 0.05, eyeY + h * 0.005)
      g.lineTo(ex + s * w * 0.075, eyeY - h * 0.015)
      g.stroke()
      g.lineWidth = w * 0.026
    }
  })
  // 입
  g.lineWidth = w * 0.018
  const my = h * 0.665
  if (opts.mouth === 'cat') {
    // ω 고양이 입 + 수염
    g.beginPath()
    g.arc(cx - w * 0.025, my - h * 0.01, w * 0.025, 0.1 * Math.PI, 0.9 * Math.PI)
    g.arc(cx + w * 0.025, my - h * 0.01, w * 0.025, 0.1 * Math.PI, 0.9 * Math.PI)
    g.stroke()
    g.fillStyle = '#f08a8a'
    g.beginPath()
    g.ellipse(cx, my - h * 0.035, w * 0.02, h * 0.013, 0, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = 'rgba(90,60,45,0.55)'
    g.lineWidth = w * 0.008
    ;[-1, 1].forEach((sd) =>
      [-0.02, 0.015].forEach((dy) => {
        g.beginPath()
        g.moveTo(cx + sd * w * 0.11, my + h * dy)
        g.lineTo(cx + sd * w * 0.24, my + h * dy * 2.2 - h * 0.005)
        g.stroke()
      })
    )
  } else if (opts.mouth === 'smirk') {
    g.beginPath()
    g.moveTo(cx - w * 0.03, my)
    g.quadraticCurveTo(cx + w * 0.01, my + h * 0.012, cx + w * 0.04, my - h * 0.012)
    g.stroke()
  } else if (opts.mouth === 'open') {
    g.fillStyle = '#c4544f'
    g.beginPath()
    g.ellipse(cx, my + 2, w * 0.03, h * 0.022, 0, 0, Math.PI)
    g.fill()
  } else {
    g.beginPath()
    g.arc(cx, my - h * 0.012, w * 0.032, Math.PI * 0.2, Math.PI * 0.8)
    g.stroke()
  }
}

// ---------------- 기타 패턴 ----------------
function drawStraw(g, w, h) {
  const r = rng(4)
  g.fillStyle = '#cdb27c'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 4) {
    g.fillStyle = `rgba(${150 + r() * 40},${120 + r() * 30},${60 + r() * 20},0.5)`
    g.fillRect(0, y, w, 2)
  }
  g.fillStyle = 'rgba(110,80,40,0.55)'
  for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 3, h)
}

function drawTile(g, w, h) {
  g.fillStyle = '#cfc6b6'
  g.fillRect(0, 0, w, h)
  const s = w / 4
  const r = rng(8)
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      g.fillStyle = `hsl(40,20%,${92 + r() * 5}%)`
      g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6)
    }
}

function drawFloral(g, w, h, base = '#f7efe2') {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  const r = rng(31)
  for (let i = 0; i < 40; i++) {
    const x = r() * w
    const y = r() * h
    const col = ['#e36b6b', '#f09aa8', '#e8a23b', '#d45a7a'][Math.floor(r() * 4)]
    g.fillStyle = '#7aa35a'
    g.beginPath()
    g.ellipse(x + 8, y + 6, 6, 3, 0.6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = col
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2
      g.beginPath()
      g.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#ffe08a'
    g.beginPath()
    g.arc(x, y, 2.5, 0, Math.PI * 2)
    g.fill()
  }
}

function drawKnit(g, w, h, color) {
  g.fillStyle = color
  g.fillRect(0, 0, w, h)
  for (let x = 0; x < w; x += 16) {
    for (let y = 0; y < h; y += 12) {
      g.strokeStyle = 'rgba(0,0,0,0.13)'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(x + 2, y)
      g.lineTo(x + 8, y + 10)
      g.lineTo(x + 14, y)
      g.stroke()
      g.strokeStyle = 'rgba(255,255,255,0.12)'
      g.beginPath()
      g.moveTo(x + 3, y + 2)
      g.lineTo(x + 8, y + 8)
      g.stroke()
    }
  }
}

function drawCorrugated(g, w, h) {
  for (let x = 0; x < w; x++) {
    const v = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2 * 12)
    g.fillStyle = `rgb(${150 + v * 50},${135 + v * 45},${110 + v * 35})`
    g.fillRect(x, 0, 1, h)
  }
  const r = rng(2)
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(120,80,40,${r() * 0.15})`
    g.fillRect(r() * w, r() * h, 3 + r() * 10, 2 + r() * 20)
  }
}

function drawSky(g, w, h) {
  const grad = g.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#8b9cb0')
  grad.addColorStop(0.45, '#c7c9c4')
  grad.addColorStop(0.62, '#ecd9b8')
  grad.addColorStop(1, '#e8d7b6')
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  const r = rng(77)
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`
    g.beginPath()
    g.ellipse(r() * w, r() * h * 0.5, 40 + r() * 120, 10 + r() * 25, 0, 0, Math.PI * 2)
    g.fill()
  }
}

function drawFur(g, w, h, color) {
  g.fillStyle = color
  g.fillRect(0, 0, w, h)
  const r = rng(6)
  for (let i = 0; i < 3000; i++) {
    g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.05)'
    const x = r() * w
    const y = r() * h
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (r() - 0.5) * 3, y + 3 + r() * 3)
    g.stroke()
  }
}

function drawWicker(g, w, h) {
  g.fillStyle = '#b08850'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 10) {
    for (let x = 0; x < w; x += 20) {
      const off = (y / 10) % 2 ? 10 : 0
      g.fillStyle = 'rgba(255,230,170,0.35)'
      g.fillRect(x + off, y + 1, 16, 7)
      g.fillStyle = 'rgba(80,50,20,0.35)'
      g.fillRect(x + off + 16, y, 4, 10)
    }
  }
}

function drawPaper(g, w, h) {
  g.fillStyle = '#fbf7ee'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#6b5a4a'
  g.lineWidth = 3
  g.lineCap = 'round'
  // 스케치: 집 + 해 + 나무
  g.beginPath()
  g.moveTo(60, 170)
  g.lineTo(60, 110)
  g.lineTo(110, 70)
  g.lineTo(160, 110)
  g.lineTo(160, 170)
  g.closePath()
  g.stroke()
  g.strokeRect(95, 130, 30, 40)
  g.beginPath()
  g.arc(200, 50, 18, 0, Math.PI * 2)
  g.stroke()
  g.beginPath()
  g.moveTo(205, 170)
  g.lineTo(205, 125)
  g.stroke()
  g.beginPath()
  g.arc(205, 112, 22, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = 'rgba(240,140,60,0.7)'
  ;[[196, 105], [214, 116], [202, 120]].forEach(([x, y]) => {
    g.beginPath()
    g.arc(x, y, 4, 0, Math.PI * 2)
    g.fill()
  })
}

function drawClock(g, w, h) {
  g.fillStyle = '#fbf6ea'
  g.beginPath()
  g.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#4a3a2a'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    g.beginPath()
    g.arc(w / 2 + Math.sin(a) * (w / 2 - 18), h / 2 - Math.cos(a) * (w / 2 - 18), i % 3 ? 3 : 5, 0, Math.PI * 2)
    g.fill()
  }
}


// ---------------- 크림 아이보리 회벽 ----------------
function drawPlaster(g, w, h, base = '#efe6d5') {
  const r = rng(23)
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  // 흙손 자국 (넓고 은은한 얼룩)
  for (let i = 0; i < 120; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 30 + r() * 60
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    const light = r() < 0.5
    grd.addColorStop(0, light ? 'rgba(255,252,244,0.12)' : 'rgba(190,170,140,0.035)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(255,255,250,${r() * 0.1})` : `rgba(150,125,95,${r() * 0.045})`
    g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5)
  }
}

// ---------------- 잎사귀 (알파) ----------------
function leafPath(g, x, y, len, wid, ang) {
  g.save()
  g.translate(x, y)
  g.rotate(ang)
  g.beginPath()
  g.moveTo(0, 0)
  g.bezierCurveTo(wid, -len * 0.25, wid * 0.8, -len * 0.8, 0, -len)
  g.bezierCurveTo(-wid * 0.8, -len * 0.8, -wid, -len * 0.25, 0, 0)
  g.closePath()
  g.restore()
}
function drawLeafShape(g, x, y, len, wid, ang, col, r) {
  leafPath(g, x, y, len, wid, ang)
  const grd = g.createLinearGradient(x - wid, y - len, x + wid, y)
  grd.addColorStop(0, col[0])
  grd.addColorStop(1, col[1])
  g.fillStyle = grd
  g.fill()
  g.save()
  g.translate(x, y)
  g.rotate(ang)
  g.strokeStyle = 'rgba(255,255,220,0.35)'
  g.lineWidth = Math.max(1, wid * 0.08)
  g.beginPath()
  g.moveTo(0, 0)
  g.quadraticCurveTo(wid * 0.1, -len * 0.5, 0, -len * 0.95)
  g.stroke()
  g.strokeStyle = 'rgba(255,255,220,0.15)'
  g.lineWidth = 1
  for (let k = 1; k < 5; k++) {
    const yy = (-len * k) / 5.5
    g.beginPath()
    g.moveTo(0, yy)
    g.lineTo(wid * 0.55, yy - len * 0.1)
    g.moveTo(0, yy)
    g.lineTo(-wid * 0.55, yy - len * 0.1)
    g.stroke()
  }
  g.restore()
}
function drawLeaf(g, w, h) {
  g.clearRect(0, 0, w, h)
  drawLeafShape(g, w / 2, h * 0.97, h * 0.92, w * 0.3, 0, ['#ffffff', '#cfcfcf'])
}
function drawLeafCluster(g, w, h) {
  g.clearRect(0, 0, w, h)
  const r = rng(41)
  g.strokeStyle = '#6b5236'
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(w / 2, h)
  g.lineTo(w / 2, h * 0.3)
  g.stroke()
  for (let i = 0; i < 11; i++) {
    const t = i / 10
    const side = i % 2 ? 1 : -1
    const x = w / 2
    const y = h * (0.95 - t * 0.62)
    const ang = side * (0.6 + r() * 0.5) - (i === 10 ? side * 0.6 : 0)
    const l = 60 + r() * 30
    const shade = 0.82 + r() * 0.18
    const c = Math.round(255 * shade)
    drawLeafShape(g, x, y, l, 16 + r() * 6, ang, [`rgb(${c},${c},${c})`, `rgb(${c - 50},${c - 50},${c - 50})`], r)
  }
}
function drawGrassTuft(g, w, h) {
  g.clearRect(0, 0, w, h)
  const r = rng(12)
  for (let i = 0; i < 26; i++) {
    const x = w * 0.2 + r() * w * 0.6
    const top = h * (0.05 + r() * 0.4)
    const bend = (r() - 0.5) * w * 0.5
    const c = 200 + r() * 55
    g.strokeStyle = `rgb(${c},${c},${c - 20})`
    g.lineWidth = 3 + r() * 3
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(x, h)
    g.quadraticCurveTo(x + bend * 0.3, (h + top) / 2, x + bend, top)
    g.stroke()
  }
}
function drawTerracotta(g, w, h) {
  const r = rng(19)
  g.fillStyle = '#c0714a'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(240,190,150,${r() * 0.18})` : `rgba(110,50,25,${r() * 0.14})`
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2)
  }
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(235,225,205,${r() * 0.25})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 6 + r() * 22, 3 + r() * 8, 0, 0, Math.PI * 2)
    g.fill()
  }
}
function drawSkyGrad(g, w, h, stops, stars) {
  const grad = g.createLinearGradient(0, 0, 0, h)
  stops.forEach(([o, c]) => grad.addColorStop(o, c))
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  if (stars) {
    const r = rng(99)
    for (let i = 0; i < stars; i++) {
      const y = r() * h * 0.55
      g.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`
      g.fillRect(r() * w, y, r() < 0.1 ? 2 : 1, r() < 0.1 ? 2 : 1)
    }
  } else {
    const r = rng(78)
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,240,220,${0.04 + r() * 0.08})`
      g.beginPath()
      g.ellipse(r() * w, r() * h * 0.5, 40 + r() * 120, 8 + r() * 20, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
}
function drawNightView(g, w, h) {
  drawSkyGrad(g, w, h, [[0, '#0e1430'], [0.55, '#28345e'], [1, '#3a3f5e']], 260)
  g.fillStyle = '#fff6d8'
  g.beginPath()
  g.arc(w * 0.75, h * 0.2, 16, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = 'rgba(255,246,216,0.12)'
  g.beginPath()
  g.arc(w * 0.75, h * 0.2, 34, 0, Math.PI * 2)
  g.fill()
  const hill = (base, amp, color, seed) => {
    g.fillStyle = color
    g.beginPath()
    g.moveTo(0, h)
    for (let x = 0; x <= w; x += 8) g.lineTo(x, base + Math.sin(x * 0.012 + seed) * amp + Math.sin(x * 0.03) * amp * 0.4)
    g.lineTo(w, h)
    g.fill()
  }
  hill(h * 0.5, 20, '#1d2540', 3)
  hill(h * 0.62, 14, '#18203a', 7)
  hill(h * 0.76, 10, '#141a2c', 13)
  const r = rng(4)
  for (let i = 0; i < 18; i++) {
    g.fillStyle = `rgba(220,255,140,${0.5 + r() * 0.5})`
    g.beginPath()
    g.arc(r() * w, h * (0.7 + r() * 0.28), 1.5 + r() * 1.5, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = 'rgba(255,200,120,0.9)'
  ;[[0.2, 0.68], [0.24, 0.69], [0.55, 0.72]].forEach(([x, y]) => g.fillRect(w * x, h * y, 4, 3))
}
function drawRainView(g, w, h) {
  drawLandscape(g, w, h, { top: '#a9b6c2', bottom: '#e3ddd0', seed: 21 })
  g.fillStyle = 'rgba(200,210,220,0.25)'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = 'rgba(255,255,255,0.35)'
  const r = rng(3)
  for (let i = 0; i < 140; i++) {
    const x = r() * w
    const y = r() * h
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x - 2, y + 10)
    g.stroke()
  }
}
function drawCork(g, w, h) {
  const r = rng(14)
  g.fillStyle = '#b98a5a'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(90,55,25,${r() * 0.3})` : `rgba(230,190,140,${r() * 0.3})`
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2)
  }
}

// =============================================================
const DEFS = {
  brick: [512, 512, (g, w, h) => drawBrick(g, w, h, false)],
  brickBump: [512, 512, (g, w, h) => drawBrick(g, w, h, true), true],
  wood: [512, 512, (g, w, h) => drawWood(g, w, h, { hue: 28, sat: 42, light: 40 })],
  woodDark: [512, 512, (g, w, h) => drawWood(g, w, h, { hue: 24, sat: 40, light: 30, seed: 9 })],
  woodLight: [512, 512, (g, w, h) => drawWood(g, w, h, { hue: 32, sat: 38, light: 55, seed: 12, rows: 6 })],
  plaidRed: [256, 256, (g, w, h) => drawPlaid(g, w, h, ['#e9dcc8', '#a33a32', '#3a2e2a', '#f4efe6'])],
  plaidBlue: [256, 256, (g, w, h) => drawPlaid(g, w, h, ['#eef0ec', '#7c9cb8', '#c9d6e2', '#ffffff'])],
  plaidBrown: [256, 256, (g, w, h) => drawPlaid(g, w, h, ['#e7d3b7', '#9b4b3c', '#6b3f2f', '#fff3df'])],
  grass: [512, 512, drawGrass],
  stone: [512, 512, drawStone],
  landscape: [512, 320, (g, w, h) => drawLandscape(g, w, h)],
  landscape2: [512, 320, (g, w, h) => drawLandscape(g, w, h, { top: '#86b8e6', bottom: '#fff1d6', seed: 42 })],
  sunset: [512, 320, (g, w, h) => drawLandscape(g, w, h, { top: '#f0b47c', bottom: '#ffe3b3', seed: 5 })],
  straw: [256, 256, drawStraw],
  tile: [256, 256, drawTile],
  floral: [256, 256, (g, w, h) => drawFloral(g, w, h)],
  knitRose: [128, 128, (g, w, h) => drawKnit(g, w, h, '#d98f7e')],
  knitOlive: [128, 128, (g, w, h) => drawKnit(g, w, h, '#7d7a4e')],
  corrugated: [512, 256, drawCorrugated],
  sky: [64, 512, drawSky],
  furWhite: [128, 128, (g, w, h) => drawFur(g, w, h, '#f6f1e6')],
  wicker: [128, 128, drawWicker],
  sketch: [256, 200, drawPaper],
  clock: [128, 128, drawClock],
  plaster: [512, 512, (g, w, h) => drawPlaster(g, w, h)],
  plasterOut: [512, 512, (g, w, h) => drawPlaster(g, w, h, '#f4e7cf')],
  leaf: [64, 128, drawLeaf],
  leafCluster: [256, 256, drawLeafCluster],
  grassTuft: [128, 128, drawGrassTuft],
  terracotta: [256, 128, drawTerracotta],
  skySunset: [64, 512, (g, w, h) => drawSkyGrad(g, w, h, [[0, '#4d5b8c'], [0.35, '#c98a8a'], [0.55, '#f6b27a'], [0.65, '#ffd9a0'], [1, '#f0c79a']])],
  skyNight: [256, 512, (g, w, h) => drawSkyGrad(g, w, h, [[0, '#070b1d'], [0.45, '#18234a'], [0.62, '#2f3a62'], [1, '#262a44']], 700)],
  viewRain: [512, 320, drawRainView],
  viewNight: [512, 320, drawNightView],
  furGray: [128, 128, (g, w, h) => drawFur(g, w, h, '#a8a39b')],
  cork: [256, 256, drawCork],
}

/** key 로 텍스처를 얻습니다. repeat 값별로 캐시됩니다. */
export function getTex(key, rx = 1, ry = 1) {
  const id = `${key}|${rx}|${ry}`
  if (texCache.has(id)) return texCache.get(id)
  const [w, h, draw, isData] = DEFS[key]
  const c = canvas(key, w, h, draw)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = isData ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = 4
  t.needsUpdate = true
  texCache.set(id, t)
  return t
}

/** 캐릭터 얼굴 텍스처 */
export function getFaceTex(opts = {}) {
  const key = 'face:' + JSON.stringify(opts)
  if (texCache.has(key)) return texCache.get(key)
  const c = canvas(key, 512, 512, (g, w, h) => drawFace(g, w, h, opts))
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  texCache.set(key, t)
  return t
}

/** 메모(포스트잇) 텍스처: 글자를 캔버스에 직접 써서 코르크보드에 붙임 */
export function getNoteTex(text, color = '#fff2a8', done = false) {
  const key = 'note:' + text + color + done
  if (texCache.has(key)) return texCache.get(key)
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = color
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = 'rgba(0,0,0,0.06)'
  g.fillRect(0, 0, 256, 26)
  g.fillStyle = '#4a3326'
  g.font = '700 38px "Pretendard","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif'
  g.textBaseline = 'top'
  const chars = [...text]
  const lines = []
  let line = ''
  chars.forEach((ch) => {
    if (g.measureText(line + ch).width > 220) {
      lines.push(line)
      line = ch
    } else line += ch
  })
  if (line) lines.push(line)
  lines.slice(0, 5).forEach((l, i) => g.fillText(l, 16, 40 + i * 44))
  if (done) {
    g.strokeStyle = 'rgba(200,60,40,0.7)'
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(14, 60)
    g.lineTo(240, 60)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  texCache.set(key, t)
  return t
}
