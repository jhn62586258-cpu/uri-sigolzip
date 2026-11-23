import { getState, setState } from './store'
import { audio } from '../audio/AudioEngine'
import { player, cam } from './shared'
import { SCENES, NPC_LINES } from '../scenes/config'

let bubbleTimer = null
let toastTimer = null
const lastLine = {}

export function goTo(scene) {
  const s = getState()
  if (s.fading || s.scene === scene) return
  audio.play('door')
  setState({ fading: true })
  setTimeout(() => {
    const from = getState().scene
    player.target = null
    player.pendingPose = null
    setState({
      scene,
      entry: from,
      pose: 'stand',
      near: [],
      bubble: null,
      brother: { phase: 'idle', reply: '' },
    })
    audio.setAmbience(SCENES[scene].ambience)
  }, 420)
  setTimeout(() => setState({ fading: false }), 560)
}

export function say(who, text, ms = 3800) {
  const id = Math.random()
  setState({ bubble: { who, text, id } })
  clearTimeout(bubbleTimer)
  bubbleTimer = setTimeout(() => {
    if (getState().bubble?.id === id) setState({ bubble: null })
  }, ms)
}

export function toast(text, ms = 2200) {
  setState({ toast: text })
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => setState({ toast: null }), ms)
}

const VOICE = { mom: 330, dad: 170, brother: 230, me: 420 }

export function talkTo(id) {
  if (id === 'brother') {
    setState({ brother: { phase: 'ask', reply: '' } })
    audio.play('talk', { pitch: VOICE.brother, count: 6 })
    faceNpc(id)
    return
  }
  const lines = NPC_LINES[id] || ['...']
  let idx = Math.floor(Math.random() * lines.length)
  if (lines.length > 1 && idx === lastLine[id]) idx = (idx + 1) % lines.length
  lastLine[id] = idx
  say(id, lines[idx])
  audio.play('talk', { pitch: VOICE[id] || 300, count: 9 })
  faceNpc(id)
}

function faceNpc(id) {
  const s = getState()
  const npc = SCENES[s.scene].npcs.find((n) => n.id === id)
  if (!npc) return
  player.heading = Math.atan2(npc.x - player.pos.x, npc.z - player.pos.z)
}

export function talkNearest() {
  const s = getState()
  const npcs = SCENES[s.scene].npcs
  let best = null
  let bd = Infinity
  npcs.forEach((n) => {
    const d = Math.hypot(n.x - player.pos.x, n.z - player.pos.z)
    if (d < n.r && d < bd) {
      bd = d
      best = n
    }
  })
  if (best) talkTo(best.id)
  else {
    toast(npcs.length ? '가족에게 조금 더 가까이 가 보세요 🙂' : '여기엔 대화할 가족이 없어요. 강아지랑 다람쥐 소리를 들어볼까요? 🐶')
    audio.play('click')
  }
}

export function playSpot(sound) {
  audio.play(sound)
  setState((s) => ({ fx: { ...s.fx, [sound]: performance.now() } }))
}

export function setPose(pose) {
  const s = getState()
  const next = s.pose === pose ? 'stand' : pose
  if (next === 'prone' && s.scene === 'room') {
    const h = SCENES.room.hideout
    const d = Math.hypot(h.x - player.pos.x, h.z - player.pos.z)
    if (d > 0.35 && d < 4.5) {
      // 아지트 안으로 걸어 들어간 뒤 엎드리기
      player.target = { x: h.x, z: h.z }
      player.pendingPose = 'prone'
      player.pendingHeading = Math.PI
      setState({ pose: 'stand' })
      toast('아지트로 쏙~ 들어가는 중 🧸')
      return
    }
  }
  if (next !== 'stand') {
    player.target = null
    player.pendingPose = null
  }
  if (next === 'prone' && s.scene === 'room') {
    player.heading = Math.PI
    cam.yaw = 0
    cam.pitch = 0.2
    cam.targetDist = Math.min(cam.targetDist, 3.4)
  }
  audio.play(next === 'stand' ? 'pop' : 'sit')
  setState({ pose: next })
}
