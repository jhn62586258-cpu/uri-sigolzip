import { getState, setState } from './store'
import { audio } from '../audio/AudioEngine'
import { player, cam } from './shared'
import { SCENES, NPC_LINES, OFFERS, TV_CHANNELS, DISHES } from '../scenes/config'
import { saveJSON } from './store'

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
  if (player.seat) standUp()
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

// =============================================================
//  확장 인터랙션
// =============================================================

/** 현재 상태에 맞는 배경음 이름 */
export function ambienceKey(s) {
  if (s.scene === 'yard') return s.time === 'rain' ? 'rain' : s.time === 'sunset' ? 'evening' : 'night'
  if (s.scene === 'living') return 'home'
  return s.roomTrack
}

export function setTime(time) {
  audio.play('pop')
  setState({ time })
}

function fx(key) {
  setState((s) => ({ fx: { ...s.fx, [key]: performance.now() } }))
}

// ---- 마당 ----
export function petDogs() {
  audio.play('dog')
  setTimeout(() => audio.play('pet'), 600)
  fx('dogs')
  toast('백구랑 회색이가 꼬리를 살랑살랑 🐶💕')
}

export function harvest() {
  const s = getState()
  if (s.tangerines >= 12) {
    toast('바구니가 가득 찼어요! 평상에 앉아 귤을 먹어볼까요? 🍵')
    audio.play('click')
    return
  }
  if (s.treeFruit <= 0) {
    setState({ treeFruit: 40 })
    toast('귤이 다시 주렁주렁 열렸어요 🍊')
    return
  }
  audio.play('harvest')
  fx('harvest')
  setState({ tangerines: s.tangerines + 1, treeFruit: s.treeFruit - 1 })
  toast(`🍊 귤 수확! 평상 바구니에 ${s.tangerines + 1}개`)
}

export function teaTime() {
  const s = getState()
  if (s.pose === 'tea') {
    standUp()
    return
  }
  player.target = null
  player.seat = { x: -8.75, z: -3.62, y: 0.56, heading: 0, exit: { x: -8.75, z: -2.85 } }
  player.pos.set(player.seat.x, player.seat.y, player.seat.z)
  player.heading = 0
  audio.play('sit')
  setTimeout(() => audio.play('sip'), 1600)
  if (s.tangerines > 0) {
    setState({ pose: 'tea', tangerines: s.tangerines - 1 })
    toast('따뜻한 차 한 잔에 귤 하나 까먹는 중 🍵🍊')
  } else {
    setState({ pose: 'tea' })
    toast('따뜻한 차 한 잔 🍵 (귤을 따 오면 같이 먹을 수 있어요)')
  }
}

export function standUp() {
  if (player.seat) {
    player.pos.set(player.seat.exit.x, 0, player.seat.exit.z)
    player.seat = null
  }
  setState({ pose: 'stand' })
}

export function openModal(name) {
  audio.play(name === 'letter' ? 'letter' : name === 'turntable' ? 'click' : 'pop')
  if (name === 'letter') setState((s) => ({ modal: 'letter', letterIdx: s.letterIdx + 1 }))
  else setState({ modal: name })
}
export function closeModal() {
  setState({ modal: null })
}
export function nextLetter() {
  audio.play('letter')
  setState((s) => ({ letterIdx: s.letterIdx + 1 }))
}
export function saveDiary(entry) {
  const diary = [{ ...entry, id: Date.now() }, ...getState().diary].slice(0, 50)
  saveJSON('sigol-diary', diary)
  setState({ diary })
  audio.play('chime')
}
export function deleteDiary(id) {
  const diary = getState().diary.filter((d) => d.id !== id)
  saveJSON('sigol-diary', diary)
  setState({ diary })
}

// ---- 거실 ----
export function hugPoodle() {
  audio.play('hug')
  fx('poodle')
  setState({ pose: 'hug' })
  setTimeout(() => getState().pose === 'hug' && setState({ pose: 'stand' }), 1800)
  toast('몽글이가 꼬옥 안겨서 꼬리를 흔들어요 🐩💗')
}

export function nextChannel() {
  const tv = (getState().tv + 1) % TV_CHANNELS.length
  audio.play('channel')
  audio.setTvChannel(tv)
  setState({ tv })
  toast(`📺 ${TV_CHANNELS[tv]}`)
}

let cookTimer = null
export function startCooking(dish) {
  const s = getState()
  if (s.cooking) {
    toast('지금 보글보글 끓는 중이에요~ 조금만 기다려요 ⏳')
    return
  }
  const dur = 9000
  audio.play('cookStart')
  audio.setStewBoost(1)
  setState({ cooking: { dish, start: performance.now(), dur } })
  say('mom', dish === 'ramen' ? '라면엔 파 송송, 계란 톡! 엄마가 옆에서 봐줄게 😊' : '김치는 푹 익혀야 맛있어. 불 조금만 줄여볼까?', 4000)
  clearTimeout(cookTimer)
  cookTimer = setTimeout(() => {
    audio.setStewBoost(0)
    audio.play('chime')
    setState({ cooking: null, served: dish })
    toast(`${DISHES[dish].emoji} ${DISHES[dish].name} 완성! 식탁에 차려졌어요`)
  }, dur)
}

export function acceptSnack(npc) {
  const s = getState()
  const offer = s.offers[npc]
  if (!offer) return
  const snacks = { ...s.snacks, [offer.snack.emoji]: (s.snacks[offer.snack.emoji] || 0) + 1 }
  audio.play('harvest')
  fx('snack-' + npc)
  setState({ snacks, offers: { ...s.offers, [npc]: { ...offer, phase: 'given' } } })
  toast(`${offer.snack.emoji} ${offer.snack.name}을(를) 받았어요!`)
}

export function offerSnack(npc) {
  const list = OFFERS[npc]
  const snack = list[Math.floor(Math.random() * list.length)]
  setState((s) => ({ offers: { ...s.offers, [npc]: { phase: 'offer', snack } } }))
  audio.play('talk', { pitch: VOICE[npc], count: 7 })
}
export function clearOffer(npc) {
  setState((s) => ({ offers: { ...s.offers, [npc]: null } }))
}

// ---- 내 방 ----
export function selectTrack(id) {
  audio.play('needle')
  setState({ roomTrack: id })
}

export function saveNotes(notes) {
  saveJSON('sigol-notes', notes)
  setState({ notes })
}

/** 근접 버튼 / 오브젝트 클릭 공통 실행기 */
export function runAction(name) {
  if (name === 'harvest') return harvest()
  if (name === 'petDogs') return petDogs()
  if (name === 'letter') return openModal('letter')
  if (name === 'tea') return teaTime()
  if (name === 'channel') return nextChannel()
  if (name === 'hug') return hugPoodle()
  if (name === 'notebook') return openModal('notebook')
  if (name === 'turntable') return openModal('turntable')
  if (name.startsWith('cook:')) return startCooking(name.slice(5))
}
