// =============================================================
//  우리 시골집 사운드 엔진 — 외부 mp3 없이 Web Audio API 합성음만 사용
//  · 첫 사용자 클릭(소리 켜기 버튼) 안에서 AudioContext 생성 + resume + 무음 버퍼 재생
//  · 공간별 상시 배경음(빗소리 / 찌개+TV / 오르골) 크로스페이드
//  · 효과음(다람쥐, 강아지, 주전자, 연필, 문, 말소리 등)
// =============================================================

const rand = (a, b) => a + Math.random() * (b - a)
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)

class AudioEngine {
  ctx = null
  master = null
  ambBus = null
  sfxBus = null
  reverbIn = null
  volume = 0.8
  muted = false
  current = null
  currentName = null
  pendingAmbience = null
  _listening = false

  get ready() {
    return !!this.ctx && this.ctx.state === 'running'
  }

  /** 반드시 사용자 제스처(클릭/터치) 핸들러 안에서 호출하세요. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return Promise.resolve()
      this.ctx = new AC({ latencyHint: 'interactive' })
      try {
        // iOS 16.4+ : 무음 스위치가 켜져 있어도 소리가 나도록 재생 세션으로 지정
        if (navigator.audioSession) navigator.audioSession.type = 'playback'
      } catch (e) {}
      this._build()
    }
    const ctx = this.ctx
    // iOS/Safari 잠금 해제용 1샘플 무음 버퍼
    try {
      const b = ctx.createBuffer(1, 1, 22050)
      const s = ctx.createBufferSource()
      s.buffer = b
      s.connect(ctx.destination)
      s.start(0)
    } catch (e) {}

    if (!this._listening) {
      this._listening = true
      const resume = () => {
        if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {})
      }
      ;['pointerdown', 'touchend', 'keydown', 'click'].forEach((ev) =>
        window.addEventListener(ev, resume, { passive: true })
      )
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') resume()
      })
    }

    const p = ctx.state !== 'running' ? ctx.resume() : Promise.resolve()
    return p
      .catch(() => {})
      .then(() => {
        if (this.pendingAmbience) {
          const n = this.pendingAmbience
          this.pendingAmbience = null
          this.setAmbience(n)
        }
      })
  }

  _build() {
    const ctx = this.ctx
    this.master = ctx.createGain()
    this.master.gain.value = this.muted ? 0 : this.volume
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.knee.value = 18
    comp.ratio.value = 3
    comp.attack.value = 0.01
    comp.release.value = 0.25
    this.master.connect(comp)
    comp.connect(ctx.destination)

    this.ambBus = ctx.createGain()
    this.ambBus.gain.value = 0.9
    this.ambBus.connect(this.master)

    this.sfxBus = ctx.createGain()
    this.sfxBus.gain.value = 1
    this.sfxBus.connect(this.master)

    // 간단한 리버브 (노이즈 임펄스 응답)
    const conv = ctx.createConvolver()
    conv.buffer = this._impulse(2.4, 2.8)
    this.reverbIn = ctx.createGain()
    this.reverbIn.gain.value = 1
    const revOut = ctx.createGain()
    revOut.gain.value = 0.4
    this.reverbIn.connect(conv)
    conv.connect(revOut)
    revOut.connect(this.master)

    this.white = this._noiseBuffer('white', 3)
    this.brown = this._noiseBuffer('brown', 3)
    this.pink = this._noiseBuffer('pink', 3)
  }

  _impulse(seconds, decay) {
    const ctx = this.ctx
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
    return buf
  }

  _noiseBuffer(type, seconds) {
    const ctx = this.ctx
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      if (type === 'white') d[i] = w
      else if (type === 'brown') {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.5
      } else {
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.969 * b2 + w * 0.153852
        b3 = 0.8665 * b3 + w * 0.3104856
        b4 = 0.55 * b4 + w * 0.5329522
        b5 = -0.7616 * b5 - w * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
        b6 = w * 0.115926
      }
    }
    return buf
  }

  // ---------- 공통 헬퍼 ----------
  loopNoise(kind = 'white') {
    const s = this.ctx.createBufferSource()
    s.buffer = this[kind]
    s.loop = true
    s.start(0, Math.random() * 2)
    return s
  }
  filter(type, freq, Q = 0.7) {
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = Q
    return f
  }
  gain(v = 1) {
    const g = this.ctx.createGain()
    g.gain.value = v
    return g
  }
  /** 짧은 노이즈 버스트 */
  burst(dest, t, { dur = 0.05, freq = 3000, Q = 1, type = 'bandpass', peak = 0.1, attack = 0.002, kind = 'white' } = {}) {
    const ctx = this.ctx
    const s = ctx.createBufferSource()
    s.buffer = this[kind]
    const f = this.filter(type, freq, Q)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(peak, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f)
    f.connect(g)
    g.connect(dest)
    s.start(t, Math.random() * 2, dur + 0.05)
    return g
  }
  /** 사인 등 짧은 톤 */
  tone(dest, t, { freq = 440, to = null, dur = 0.2, type = 'sine', peak = 0.1, attack = 0.005, glide = null } = {}) {
    const ctx = this.ctx
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + (glide || dur))
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(peak, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(dest)
    o.start(t)
    o.stop(t + dur + 0.05)
    return { o, g }
  }

  // ---------- 볼륨 ----------
  setVolume(v) {
    this.volume = v
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.05)
  }
  setMuted(m) {
    this.muted = m
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.05)
  }

  // ---------- 배경음 ----------
  setAmbience(name) {
    if (!this.ctx) {
      this.pendingAmbience = name
      return
    }
    if (name === this.currentName) return
    const ctx = this.ctx
    const now = ctx.currentTime
    if (this.current) {
      const old = this.current
      old.out.gain.cancelScheduledValues(now)
      old.out.gain.setValueAtTime(old.out.gain.value, now)
      old.out.gain.linearRampToValueAtTime(0, now + 1.2)
      setTimeout(() => old.stop(), 1400)
    }
    this.currentName = name
    const factory = {
      rain: rainAmbience,
      evening: eveningAmbience,
      night: nightAmbience,
      home: homeAmbience,
      musicbox: musicBoxAmbience,
      piano: pianoAmbience,
      lofi: lofiAmbience,
    }[name]
    if (!factory) {
      this.current = null
      return
    }
    const amb = factory(this)
    amb.out.gain.setValueAtTime(0, now)
    amb.out.gain.linearRampToValueAtTime(1, now + 1.5)
    amb.out.connect(this.ambBus)
    if (amb.setChannel) amb.setChannel(this.tvChannel)
    this.current = amb
  }

  // ---------- TV 채널 (거실 배경음 안의 TV 소리) ----------
  tvChannel = 0
  setTvChannel(i) {
    this.tvChannel = i
    if (this.current && this.current.setChannel) this.current.setChannel(i)
  }

  setStewBoost(v) {
    if (this.current && this.current.setStewBoost) this.current.setStewBoost(v)
  }

  // ---------- 효과음 ----------
  play(name, opt) {
    if (!this.ctx) return
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {})
    const fn = SFX[name]
    if (fn) fn(this, this.ctx.currentTime + 0.02, opt)
  }
}

// =============================================================
//  배경음 1) 마당: 잔잔한 빗소리
// =============================================================
function rainAmbience(E) {
  const ctx = E.ctx
  const out = E.gain(0)
  const nodes = []

  // 쏴아- 하는 넓은 빗소리
  const n1 = E.loopNoise('pink')
  const hp = E.filter('highpass', 500)
  const lp = E.filter('lowpass', 5200)
  const g1 = E.gain(0.55)
  n1.connect(hp).connect(lp).connect(g1).connect(out)
  // 낮게 깔리는 웅웅거림
  const n2 = E.loopNoise('brown')
  const lp2 = E.filter('lowpass', 380)
  const g2 = E.gain(0.22)
  n2.connect(lp2).connect(g2).connect(out)
  // 바람결처럼 천천히 커졌다 작아짐
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoG = E.gain(0.16)
  lfo.connect(lfoG).connect(g1.gain)
  lfo.start()
  nodes.push(n1, n2, lfo)

  // 톡톡 떨어지는 빗방울
  const drops = setInterval(() => {
    const t0 = ctx.currentTime + 0.05
    const k = Math.floor(rand(1, 4))
    for (let i = 0; i < k; i++) {
      E.burst(out, t0 + rand(0, 0.06), {
        dur: rand(0.015, 0.045),
        freq: rand(1800, 7000),
        Q: rand(2, 5),
        peak: rand(0.03, 0.12),
      })
    }
  }, 60)
  // 처마에서 똑... 똑... 떨어지는 물방울
  let dripTimer
  const drip = () => {
    const t = ctx.currentTime + 0.05
    const f = rand(800, 1500)
    E.tone(out, t, { freq: f, to: f * 1.5, dur: 0.14, peak: 0.05, glide: 0.05 })
    const send = E.gain(0.6)
    E.tone(send, t, { freq: f, to: f * 1.5, dur: 0.14, peak: 0.04, glide: 0.05 })
    send.connect(E.reverbIn)
    dripTimer = setTimeout(drip, rand(350, 1400))
  }
  drip()

  return {
    out,
    stop() {
      clearInterval(drops)
      clearTimeout(dripTimer)
      nodes.forEach((n) => {
        try {
          n.stop()
        } catch (e) {}
      })
      out.disconnect()
    },
  }
}

// =============================================================
//  배경음 2) 거실과 부엌: 보글보글 찌개 + 아늑한 TV 소리 + 난로 장작
// =============================================================
function homeAmbience(E) {
  const ctx = E.ctx
  const out = E.gain(0)
  const nodes = []
  const timers = []

  // --- 찌개: 은근한 끓는 소리 + 보글 방울 ---
  const stewBus = E.gain(0.9)
  stewBus.connect(out)
  const simmer = E.loopNoise('brown')
  const sl = E.filter('lowpass', 320)
  const sg = E.gain(0.12)
  simmer.connect(sl).connect(sg).connect(stewBus)
  nodes.push(simmer)
  const bubbleLp = E.filter('lowpass', 1400)
  bubbleLp.connect(stewBus)
  let bubbleTimer
  const bubble = () => {
    const t = ctx.currentTime + 0.03
    const cluster = Math.random() < 0.3 ? 3 : 1
    for (let i = 0; i < cluster; i++) {
      const f = rand(140, 380)
      E.tone(bubbleLp, t + i * rand(0.03, 0.07), { freq: f, to: f * rand(1.8, 2.8), dur: rand(0.05, 0.1), peak: rand(0.08, 0.2), glide: 0.05 })
    }
    bubbleTimer = setTimeout(bubble, rand(60, 260))
  }
  bubble()

  // --- TV: 채널별 소리 (0 시골 다큐 / 1 모닥불 / 2 비 오는 숲 / 3 만화) ---
  const tvOut = E.gain(0.6)
  tvOut.connect(out)
  const ch = [E.gain(0), E.gain(0), E.gain(0), E.gain(0)]
  ch.forEach((g) => g.connect(tvOut))
  let active = 0

  // 채널 0: 웅얼웅얼 말소리 + 잔잔한 배경 음악
  const voice = ctx.createOscillator()
  voice.type = 'sawtooth'
  voice.frequency.value = 160
  const f1 = E.filter('bandpass', 600, 5)
  const f2 = E.filter('bandpass', 1500, 7)
  const vg = E.gain(0)
  const vlp = E.filter('lowpass', 1700)
  voice.connect(f1)
  voice.connect(f2)
  f1.connect(vg)
  f2.connect(vg)
  vg.connect(vlp).connect(ch[0])
  voice.start()
  nodes.push(voice)
  let t = ctx.currentTime + 0.4
  let syl = 0
  let speaker = 120
  timers.push(
    setInterval(() => {
      while (t < ctx.currentTime + 0.7) {
        if (syl <= 0) {
          vg.gain.setValueAtTime(0, t)
          t += rand(0.35, 1.4)
          syl = Math.floor(rand(4, 14))
          speaker = Math.random() < 0.5 ? rand(105, 135) : rand(195, 235)
          continue
        }
        const dur = rand(0.08, 0.2)
        voice.frequency.setValueAtTime(speaker * rand(0.9, 1.25), t)
        voice.frequency.linearRampToValueAtTime(speaker * rand(0.8, 1.15), t + dur)
        f1.frequency.setValueAtTime(rand(380, 850), t)
        f2.frequency.setValueAtTime(rand(1000, 2300), t)
        vg.gain.setValueAtTime(0, t)
        vg.gain.linearRampToValueAtTime(rand(0.25, 0.45), t + 0.025)
        vg.gain.linearRampToValueAtTime(0.0, t + dur)
        t += dur + rand(0.01, 0.05)
        syl--
      }
    }, 120)
  )
  const tvMusic = E.gain(0.05)
  tvMusic.connect(E.filter('lowpass', 1200)).connect(ch[0])
  const chords = [[60, 64, 67], [57, 60, 64], [62, 65, 69], [55, 59, 62]]
  let ci = 0
  let mt = ctx.currentTime + 0.5
  timers.push(
    setInterval(() => {
      while (mt < ctx.currentTime + 1) {
        chords[ci % 4].forEach((m) => E.tone(tvMusic, mt, { freq: mtof(m), dur: 2.2, type: 'triangle', peak: 0.5, attack: 0.2 }))
        ci++
        mt += 2.2
      }
    }, 300)
  )

  // 채널 1: 모닥불 (낮은 불꽃 소리 + 타닥타닥)
  const roar = E.loopNoise('brown')
  roar.connect(E.filter('lowpass', 450)).connect(E.gain(0.5)).connect(ch[1])
  nodes.push(roar)
  let fireT
  const fire = () => {
    if (active === 1) {
      const tt = ctx.currentTime + 0.02
      const n = Math.random() < 0.3 ? 3 : 1
      for (let i = 0; i < n; i++) E.burst(ch[1], tt + i * rand(0.01, 0.04), { dur: rand(0.005, 0.03), freq: rand(1500, 6000), type: 'highpass', peak: rand(0.15, 0.5) })
    }
    fireT = setTimeout(fire, rand(40, 260))
  }
  fire()

  // 채널 2: 비 오는 숲 (빗소리 + 새소리)
  const forest = E.loopNoise('pink')
  forest.connect(E.filter('highpass', 500)).connect(E.filter('lowpass', 4200)).connect(E.gain(0.6)).connect(ch[2])
  nodes.push(forest)
  let birdT
  const bird = () => {
    if (active === 2) {
      const tt = ctx.currentTime + 0.05
      const f = rand(2400, 3600)
      const k = Math.floor(rand(2, 5))
      for (let i = 0; i < k; i++) E.tone(ch[2], tt + i * 0.13, { freq: f, to: f * rand(1.2, 1.5), dur: 0.09, peak: 0.12, glide: 0.06 })
    }
    birdT = setTimeout(bird, rand(1200, 3500))
  }
  bird()

  // 채널 3: 만화 (통통 튀는 멜로디 + 뿅 소리)
  const toon = E.gain(0.5)
  toon.connect(E.filter('lowpass', 2600)).connect(ch[3])
  const TUNE = [72, 76, 79, 76, 74, 77, 81, 77, 76, 79, 84, 79, 77, 74, 72, 0]
  let ti = 0
  let tt3 = ctx.currentTime + 0.3
  timers.push(
    setInterval(() => {
      while (tt3 < ctx.currentTime + 0.6) {
        const m = TUNE[ti % TUNE.length]
        if (m && active === 3) {
          E.tone(toon, tt3, { freq: mtof(m), dur: 0.14, type: 'square', peak: 0.08 })
          if (ti % 4 === 0) E.tone(toon, tt3, { freq: mtof(m - 24), dur: 0.2, type: 'triangle', peak: 0.15 })
          if (ti % 16 === 7) E.tone(toon, tt3 + 0.1, { freq: 220, to: 880, dur: 0.25, peak: 0.12, glide: 0.2 })
        }
        ti++
        tt3 += 0.19
      }
    }, 100)
  )

  const setChannel = (i) => {
    active = i
    const now = ctx.currentTime
    ch.forEach((g, k) => {
      g.gain.cancelScheduledValues(now)
      g.gain.setTargetAtTime(k === i ? 1 : 0, now, 0.08)
    })
  }

  // --- 난로 장작 타닥 ---
  let crackleTimer
  const crackle = () => {
    E.burst(out, ctx.currentTime + 0.02, { dur: rand(0.006, 0.02), freq: rand(2000, 5000), type: 'highpass', peak: rand(0.03, 0.1) })
    crackleTimer = setTimeout(crackle, rand(90, 900))
  }
  crackle()

  const setStewBoost = (v) => stewBus.gain.setTargetAtTime(0.9 + v * 2.2, ctx.currentTime, 0.4)

  return {
    out,
    setChannel,
    setStewBoost,
    stop() {
      timers.forEach(clearInterval)
      clearTimeout(bubbleTimer)
      clearTimeout(crackleTimer)
      clearTimeout(fireT)
      clearTimeout(birdT)
      nodes.forEach((n) => {
        try {
          n.stop()
        } catch (e) {}
      })
      out.disconnect()
    },
  }
}

// =============================================================
//  배경음 3) 내 방 아지트: 따뜻한 오르골 + 피아노 패드
// =============================================================
// 직접 작곡한 짧은 자장가풍 멜로디 [MIDI, 박자]
const MELODY = [
  [72, 1], [76, 1], [79, 1], [76, 1],
  [77, 1.5], [76, 0.5], [74, 2],
  [71, 1], [74, 1], [77, 1], [74, 1],
  [76, 1.5], [74, 0.5], [72, 2],
  [69, 1], [72, 1], [76, 1], [72, 1],
  [74, 1], [72, 1], [71, 1], [74, 1],
  [72, 1], [67, 1], [69, 1], [71, 1],
  [72, 3], [0, 1],
]
const CHORDS = [
  [48, 55, 64], [43, 50, 59], [43, 50, 59], [48, 55, 64],
  [45, 52, 60], [41, 48, 57], [43, 50, 59], [48, 55, 64],
]

function musicBoxAmbience(E) {
  const ctx = E.ctx
  const out = E.gain(0)
  const dry = E.gain(0.8)
  dry.connect(out)
  const send = E.gain(0.7)
  send.connect(E.reverbIn)
  // out 이 0 으로 페이드될 때 리버브도 함께 줄도록 send 앞에 out 을 거치게 함
  const toRev = E.gain(1)
  out.connect(toRev)
  toRev.connect(send)
  // 방 안 공기 소리 (아주 작게)
  const air = E.loopNoise('pink')
  const airLp = E.filter('lowpass', 900)
  const airG = E.gain(0.025)
  air.connect(airLp).connect(airG).connect(dry)

  const bell = (m, t, vel = 1) => {
    const f = mtof(m)
    const partials = [
      [1, 0.22, 2.2],
      [2, 0.07, 1.1],
      [3, 0.035, 0.6],
      [4.2, 0.025, 0.35],
    ]
    partials.forEach(([ratio, g, d]) => E.tone(dry, t, { freq: f * ratio, dur: d, peak: g * vel, attack: 0.003 }))
  }
  const pad = (notes, t, len) => {
    const lp = E.filter('lowpass', 900)
    lp.connect(dry)
    notes.forEach((m) => {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = mtof(m)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.05, t + 0.25)
      g.gain.exponentialRampToValueAtTime(0.0008, t + len)
      o.connect(g).connect(lp)
      o.start(t)
      o.stop(t + len + 0.1)
    })
  }

  const beat = 0.56
  let i = 0
  let beatPos = 0
  let lastBar = -1
  let t = ctx.currentTime + 0.4
  const sched = setInterval(() => {
    while (t < ctx.currentTime + 0.8) {
      const bar = Math.floor(beatPos / 4 + 1e-6)
      if (bar !== lastBar && Math.abs(beatPos - bar * 4) < 1e-6) {
        pad(CHORDS[bar % CHORDS.length], t, beat * 4.2)
        lastBar = bar
      }
      const [m, b] = MELODY[i]
      if (m) bell(m, t, rand(0.85, 1))
      t += b * beat
      beatPos += b
      i = (i + 1) % MELODY.length
      if (i === 0) {
        beatPos = 0
        lastBar = -1
      }
    }
  }, 100)

  return {
    out,
    stop() {
      clearInterval(sched)
      try {
        air.stop()
      } catch (e) {}
      out.disconnect()
      toRev.disconnect()
    },
  }
}

// =============================================================
//  효과음
// =============================================================
const SFX = {
  click(E, t) {
    E.tone(E.sfxBus, t, { freq: 880, to: 1320, dur: 0.12, peak: 0.08, glide: 0.04 })
  },
  // 🐿️ 다람쥐: 짹짹 빠른 고음 지저귐
  squirrel(E, t) {
    const n = 7
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < n; i++) {
        const tt = t + r * 0.9 + i * 0.085
        const f = rand(2600, 3400)
        E.tone(E.sfxBus, tt, { freq: f, to: f * 1.6, dur: 0.06, peak: 0.16, glide: 0.035 })
        E.burst(E.sfxBus, tt, { dur: 0.02, freq: 6000, Q: 2, peak: 0.04 })
      }
    }
  },
  // 🐶 강아지: 멍! 멍!
  dog(E, t) {
    const bark = (tt, base) => {
      const ctx = E.ctx
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(base, tt)
      o.frequency.exponentialRampToValueAtTime(base * 1.25, tt + 0.03)
      o.frequency.exponentialRampToValueAtTime(base * 0.55, tt + 0.17)
      const bp = E.filter('bandpass', 950, 1.2)
      const lp = E.filter('lowpass', 2600)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, tt)
      g.gain.linearRampToValueAtTime(0.55, tt + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.2)
      o.connect(bp).connect(lp).connect(g).connect(E.sfxBus)
      o.start(tt)
      o.stop(tt + 0.25)
      E.burst(E.sfxBus, tt, { dur: 0.09, freq: 1300, Q: 1, peak: 0.12 })
      const send = E.gain(0.3)
      g.connect(send)
      send.connect(E.reverbIn)
    }
    bark(t, 430)
    bark(t + 0.3, 400)
    bark(t + 0.95, 450)
  },
  // 🫖 주전자: 보글보글 + 삐이~ 휘파람
  kettle(E, t) {
    const ctx = E.ctx
    const dur = 4.2
    const n = ctx.createBufferSource()
    n.buffer = E.brown
    n.loop = true
    const lp = E.filter('lowpass', 700)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.5, t + 1.2)
    g.gain.linearRampToValueAtTime(0, t + dur)
    n.connect(lp).connect(g).connect(E.sfxBus)
    n.start(t)
    n.stop(t + dur + 0.1)
    for (let i = 0; i < 26; i++) {
      const tt = t + rand(0.1, dur - 0.5)
      const f = rand(200, 500)
      E.tone(E.sfxBus, tt, { freq: f, to: f * 2.2, dur: 0.07, peak: 0.08, glide: 0.05 })
    }
    const w = ctx.createOscillator()
    w.type = 'sine'
    w.frequency.setValueAtTime(1700, t + 1)
    w.frequency.linearRampToValueAtTime(2150, t + 2.4)
    const vib = ctx.createOscillator()
    vib.frequency.value = 6
    const vibG = E.gain(28)
    vib.connect(vibG).connect(w.frequency)
    const wg = ctx.createGain()
    wg.gain.setValueAtTime(0, t)
    wg.gain.setValueAtTime(0, t + 1)
    wg.gain.linearRampToValueAtTime(0.11, t + 2.2)
    wg.gain.setValueAtTime(0.11, t + dur - 0.6)
    wg.gain.linearRampToValueAtTime(0, t + dur)
    w.connect(wg).connect(E.sfxBus)
    const breath = ctx.createBufferSource()
    breath.buffer = E.white
    breath.loop = true
    const bbp = E.filter('bandpass', 2000, 3)
    const bg = ctx.createGain()
    bg.gain.setValueAtTime(0, t + 1)
    bg.gain.linearRampToValueAtTime(0.05, t + 2.2)
    bg.gain.linearRampToValueAtTime(0, t + dur)
    breath.connect(bbp).connect(bg).connect(E.sfxBus)
    breath.start(t)
    breath.stop(t + dur + 0.1)
    w.start(t)
    vib.start(t)
    w.stop(t + dur + 0.1)
    vib.stop(t + dur + 0.1)
  },
  // ✏️ 연필 사각사각
  pencil(E, t) {
    const strokes = 12
    let tt = t
    for (let i = 0; i < strokes; i++) {
      const d = rand(0.08, 0.17)
      const ctx = E.ctx
      const s = ctx.createBufferSource()
      s.buffer = E.white
      const bp = E.filter('bandpass', rand(3200, 5200), 0.9)
      const hp = E.filter('highpass', 1800)
      const g = ctx.createGain()
      const pk = rand(0.12, 0.26)
      g.gain.setValueAtTime(0, tt)
      g.gain.linearRampToValueAtTime(pk, tt + d * 0.3)
      g.gain.linearRampToValueAtTime(pk * 0.6, tt + d * 0.7)
      g.gain.linearRampToValueAtTime(0, tt + d)
      s.connect(bp).connect(hp).connect(g).connect(E.sfxBus)
      s.start(tt, Math.random() * 2, d + 0.05)
      tt += d + rand(0.02, 0.08)
    }
  },
  // 🚪 문 여닫는 소리
  door(E, t) {
    E.tone(E.sfxBus, t, { freq: 140, to: 70, dur: 0.25, peak: 0.25, glide: 0.2 })
    E.burst(E.sfxBus, t, { dur: 0.08, freq: 600, Q: 1, peak: 0.1 })
    const ctx = E.ctx
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(320, t + 0.05)
    o.frequency.linearRampToValueAtTime(240, t + 0.45)
    const bp = E.filter('bandpass', 900, 6)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t + 0.05)
    g.gain.linearRampToValueAtTime(0.05, t + 0.15)
    g.gain.linearRampToValueAtTime(0, t + 0.45)
    o.connect(bp).connect(g).connect(E.sfxBus)
    o.start(t)
    o.stop(t + 0.5)
  },
  // 💬 동물의 숲 느낌 말소리
  talk(E, t, opt = {}) {
    const base = opt.pitch || 300
    const n = opt.count || 8
    const lp = E.filter('lowpass', 2200)
    lp.connect(E.sfxBus)
    for (let i = 0; i < n; i++) {
      const f = base * rand(0.85, 1.3)
      E.tone(lp, t + i * 0.075, { freq: f, to: f * rand(0.9, 1.15), dur: 0.065, type: 'square', peak: 0.04 })
    }
  },
  pop(E, t) {
    E.tone(E.sfxBus, t, { freq: 500, to: 1100, dur: 0.1, peak: 0.12, glide: 0.06 })
  },
  sit(E, t) {
    E.burst(E.sfxBus, t, { dur: 0.12, freq: 400, Q: 0.8, peak: 0.12, kind: 'pink' })
  },
}


// =============================================================
//  마당 · 노을 저녁: 산들바람 + 멀리 새소리 + 풍경 소리
// =============================================================
function eveningAmbience(E) {
  const ctx = E.ctx
  const out = E.gain(0)
  const wind = E.loopNoise('pink')
  const bp = E.filter('bandpass', 500, 0.6)
  const wg = E.gain(0.35)
  wind.connect(bp).connect(wg).connect(out)
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.09
  const lg = E.gain(250)
  lfo.connect(lg).connect(bp.frequency)
  lfo.start()
  let birdT, chimeT
  const bird = () => {
    const t = ctx.currentTime + 0.05
    const f = rand(1800, 2800)
    const n = Math.floor(rand(2, 5))
    for (let i = 0; i < n; i++) E.tone(out, t + i * rand(0.12, 0.22), { freq: f, to: f * rand(0.7, 1.4), dur: 0.12, peak: 0.05, glide: 0.1 })
    birdT = setTimeout(bird, rand(2000, 5000))
  }
  const chime = () => {
    const t = ctx.currentTime + 0.05
    const send = E.gain(0.7)
    send.connect(E.reverbIn)
    ;[84, 88, 91, 86].forEach((m, i) => {
      if (Math.random() < 0.6) {
        E.tone(out, t + i * rand(0.15, 0.4), { freq: mtof(m), dur: 2.2, peak: 0.03 })
        E.tone(send, t + i * rand(0.15, 0.4), { freq: mtof(m), dur: 2.2, peak: 0.03 })
      }
    })
    chimeT = setTimeout(chime, rand(5000, 11000))
  }
  bird()
  chime()
  return {
    out,
    stop() {
      clearTimeout(birdT)
      clearTimeout(chimeT)
      try {
        wind.stop()
        lfo.stop()
      } catch (e) {}
      out.disconnect()
    },
  }
}

// =============================================================
//  마당 · 별빛 밤: 귀뚜라미 + 개구리 + 잔잔한 밤바람
// =============================================================
function nightAmbience(E) {
  const ctx = E.ctx
  const out = E.gain(0)
  const air = E.loopNoise('brown')
  air.connect(E.filter('lowpass', 300)).connect(E.gain(0.15)).connect(out)
  const timers = []
  // 귀뚜라미: 4~5kHz 짧은 펄스 묶음
  ;[0, 1, 2].forEach((k) => {
    let t = ctx.currentTime + 0.3 + k * 0.4
    const f = 4200 + k * 380
    timers.push(
      setInterval(() => {
        while (t < ctx.currentTime + 0.6) {
          const n = 3 + Math.floor(Math.random() * 2)
          for (let i = 0; i < n; i++) E.tone(out, t + i * 0.045, { freq: f, dur: 0.03, peak: 0.025 + k * 0.006, attack: 0.004 })
          t += rand(0.45, 0.9)
        }
      }, 150)
    )
  })
  // 개구리
  let frogT
  const frog = () => {
    const t = ctx.currentTime + 0.05
    const n = Math.floor(rand(2, 4))
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(rand(150, 210), t + i * 0.25)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t + i * 0.25)
      g.gain.linearRampToValueAtTime(0.05, t + i * 0.25 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.25 + 0.16)
      const f = E.filter('bandpass', 700, 3)
      o.connect(f).connect(g).connect(out)
      o.start(t + i * 0.25)
      o.stop(t + i * 0.25 + 0.2)
    }
    frogT = setTimeout(frog, rand(1500, 4500))
  }
  frog()
  return {
    out,
    stop() {
      timers.forEach(clearInterval)
      clearTimeout(frogT)
      try {
        air.stop()
      } catch (e) {}
      out.disconnect()
    },
  }
}

// =============================================================
//  내 방 LP 2) 새벽 피아노
// =============================================================
function pianoAmbience(E) {
  const ctx = E.ctx
  const out = E.gain(0)
  const dry = E.gain(0.9)
  dry.connect(out)
  const toRev = E.gain(1.2)
  out.connect(toRev)
  toRev.connect(E.reverbIn)
  const note = (m, t, vel = 1, len = 3.2) => {
    const f = mtof(m)
    const lp = E.filter('lowpass', 2400)
    lp.connect(dry)
    ;[[1, 0.16], [2, 0.06], [3, 0.025], [4, 0.012]].forEach(([r, g]) =>
      E.tone(lp, t, { freq: f * r * (1 + (r - 1) * 0.0008), dur: len / r, peak: g * vel, attack: 0.006 })
    )
  }
  // Fmaj7 - Em7 - Dm7 - Cmaj7
  const PROG = [
    [41, 57, 60, 64, 69],
    [40, 55, 59, 62, 67],
    [38, 53, 57, 60, 65],
    [36, 52, 55, 59, 64],
  ]
  const MEL = [[76, 72], [74, 71], [72, 69], [71, 67, 72]]
  const beat = 0.75
  let bar = 0
  let t = ctx.currentTime + 0.4
  const sched = setInterval(() => {
    while (t < ctx.currentTime + 1.2) {
      const c = PROG[bar % 4]
      note(c[0], t, 0.9, 4)
      const arp = [1, 2, 3, 4, 3, 2]
      arp.forEach((k, i) => note(c[k], t + i * (beat / 1.5), 0.5 + Math.random() * 0.15, 2.6))
      const mel = MEL[bar % 4]
      mel.forEach((m, i) => note(m, t + beat * (0.5 + i * 1.3), 0.75, 3))
      t += beat * 4
      bar++
    }
  }, 200)
  return {
    out,
    stop() {
      clearInterval(sched)
      out.disconnect()
      toRev.disconnect()
    },
  }
}

// =============================================================
//  내 방 LP 3) 로파이 빗소리
// =============================================================
function lofiAmbience(E) {
  const ctx = E.ctx
  const out = E.gain(0)
  const rain = E.loopNoise('pink')
  rain.connect(E.filter('highpass', 400)).connect(E.filter('lowpass', 3000)).connect(E.gain(0.28)).connect(out)
  const hiss = E.loopNoise('white')
  hiss.connect(E.filter('highpass', 5000)).connect(E.gain(0.012)).connect(out)
  let crackT
  const crackle = () => {
    E.burst(out, ctx.currentTime + 0.01, { dur: 0.006, freq: rand(2000, 6000), type: 'highpass', peak: rand(0.02, 0.07) })
    crackT = setTimeout(crackle, rand(30, 280))
  }
  crackle()
  const keys = E.filter('lowpass', 1400)
  const kg = E.gain(0.9)
  keys.connect(kg).connect(out)
  const trem = ctx.createOscillator()
  trem.frequency.value = 4.5
  const tg = E.gain(0.15)
  trem.connect(tg).connect(kg.gain)
  trem.start()
  const chord = (notes, t, len) =>
    notes.forEach((m) => {
      E.tone(keys, t, { freq: mtof(m), dur: len, peak: 0.05, attack: 0.02 })
      E.tone(keys, t, { freq: mtof(m) * 2, dur: len * 0.5, peak: 0.012, attack: 0.01 })
    })
  const drums = E.gain(0.8)
  drums.connect(E.filter('lowpass', 5000)).connect(out)
  const kick = (t) => E.tone(drums, t, { freq: 110, to: 45, dur: 0.3, peak: 0.45, glide: 0.12 })
  const snare = (t) => E.burst(drums, t, { dur: 0.18, freq: 1800, Q: 0.7, peak: 0.13, kind: 'pink' })
  const hat = (t, v) => E.burst(drums, t, { dur: 0.04, freq: 8000, type: 'highpass', peak: v })
  // Dm9 - G13 - Cmaj9 - Am9
  const PROG = [
    [50, 57, 60, 64, 65],
    [43, 53, 57, 59, 64],
    [48, 55, 59, 62, 64],
    [45, 55, 60, 64, 67],
  ]
  const beat = 60 / 74
  let bar = 0
  let t = ctx.currentTime + 0.4
  const sched = setInterval(() => {
    while (t < ctx.currentTime + 1.2) {
      chord(PROG[bar % 4], t, beat * 3.8)
      for (let b = 0; b < 4; b++) {
        const bt = t + b * beat
        if (b === 0 || (b === 2 && bar % 2)) kick(bt)
        if (b === 2 && !(bar % 2)) kick(bt + beat * 0.5)
        if (b === 1 || b === 3) snare(bt)
        hat(bt, 0.05)
        hat(bt + beat * 0.58, 0.03)
      }
      t += beat * 4
      bar++
    }
  }, 200)
  return {
    out,
    stop() {
      clearInterval(sched)
      clearTimeout(crackT)
      try {
        rain.stop()
        hiss.stop()
        trem.stop()
      } catch (e) {}
      out.disconnect()
    },
  }
}

const SFX_EXTRA = {
  // 🐶 쓰다듬기: 낑낑 좋아하는 소리
  pet(E, t) {
    for (let i = 0; i < 2; i++) {
      const tt = t + i * 0.35
      const ctx = E.ctx
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.setValueAtTime(700, tt)
      o.frequency.linearRampToValueAtTime(1150, tt + 0.12)
      o.frequency.linearRampToValueAtTime(820, tt + 0.28)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, tt)
      g.gain.linearRampToValueAtTime(0.12, tt + 0.03)
      g.gain.linearRampToValueAtTime(0, tt + 0.3)
      o.connect(E.filter('lowpass', 2500)).connect(g).connect(E.sfxBus)
      o.start(tt)
      o.stop(tt + 0.35)
    }
  },
  // 🐩 안아주기: 깡! 하는 작은 짖음 + 반짝 아르페지오
  hug(E, t) {
    E.tone(E.sfxBus, t, { freq: 900, to: 600, dur: 0.12, type: 'sawtooth', peak: 0.08, glide: 0.1 })
    E.tone(E.sfxBus, t + 0.2, { freq: 1000, to: 650, dur: 0.12, type: 'sawtooth', peak: 0.07, glide: 0.1 })
    ;[76, 79, 84, 88].forEach((m, i) => E.tone(E.sfxBus, t + 0.35 + i * 0.08, { freq: mtof(m), dur: 0.5, peak: 0.07 }))
  },
  harvest(E, t) {
    for (let i = 0; i < 5; i++) E.burst(E.sfxBus, t + i * 0.04, { dur: 0.08, freq: rand(2500, 5000), Q: 0.8, peak: 0.08, kind: 'pink' })
    E.tone(E.sfxBus, t + 0.25, { freq: 420, to: 900, dur: 0.12, peak: 0.15, glide: 0.08 })
  },
  letter(E, t) {
    for (let i = 0; i < 4; i++) E.burst(E.sfxBus, t + i * 0.09, { dur: 0.12, freq: rand(1500, 3500), Q: 0.6, peak: 0.08, kind: 'pink' })
    ;[79, 83, 86].forEach((m, i) => E.tone(E.sfxBus, t + 0.4 + i * 0.12, { freq: mtof(m), dur: 0.8, peak: 0.06 }))
  },
  chime(E, t) {
    const send = E.gain(0.8)
    send.connect(E.reverbIn)
    ;[72, 76, 79, 84].forEach((m, i) => {
      E.tone(E.sfxBus, t + i * 0.12, { freq: mtof(m), dur: 1.2, peak: 0.09 })
      E.tone(send, t + i * 0.12, { freq: mtof(m), dur: 1.2, peak: 0.05 })
    })
  },
  needle(E, t) {
    E.burst(E.sfxBus, t, { dur: 0.05, freq: 900, Q: 1, peak: 0.25 })
    for (let i = 0; i < 14; i++) E.burst(E.sfxBus, t + 0.1 + i * rand(0.04, 0.1), { dur: 0.008, freq: rand(2000, 6000), type: 'highpass', peak: 0.1 })
  },
  sip(E, t) {
    const ctx = E.ctx
    const s = ctx.createBufferSource()
    s.buffer = E.pink
    const f = E.filter('bandpass', 800, 4)
    f.frequency.setValueAtTime(600, t)
    f.frequency.linearRampToValueAtTime(1600, t + 0.35)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.25, t + 0.08)
    g.gain.linearRampToValueAtTime(0, t + 0.4)
    s.connect(f).connect(g).connect(E.sfxBus)
    s.start(t, 0, 0.5)
    E.tone(E.sfxBus, t + 0.5, { freq: 320, to: 260, dur: 0.15, peak: 0.08 })
  },
  channel(E, t) {
    E.tone(E.sfxBus, t, { freq: 1500, dur: 0.03, type: 'square', peak: 0.05 })
    E.burst(E.sfxBus, t + 0.03, { dur: 0.25, freq: 3000, Q: 0.3, peak: 0.08 })
  },
  cookStart(E, t) {
    E.tone(E.sfxBus, t, { freq: 2000, dur: 0.04, type: 'square', peak: 0.04 })
    E.tone(E.sfxBus, t + 0.08, { freq: 2000, dur: 0.04, type: 'square', peak: 0.04 })
    E.burst(E.sfxBus, t + 0.2, { dur: 0.6, freq: 600, Q: 0.5, peak: 0.12, kind: 'pink', attack: 0.15 })
  },
}
Object.assign(SFX, SFX_EXTRA)

export const audio = new AudioEngine()

if (typeof window !== 'undefined' && /[?&]dev/.test(window.location.search)) window.__audio = audio
