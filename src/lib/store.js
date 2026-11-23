import { useSyncExternalStore } from 'react'

// 아주 작은 전역 상태 저장소 (외부 라이브러리 없이)
const listeners = new Set()

// localStorage 는 일부 환경(시크릿 모드, 미리보기 등)에서 막혀 있을 수 있어 try/catch 로 감쌉니다.
export function loadJSON(key, fallback) {
  try {
    const v = window.localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch (e) {
    return fallback
  }
}
export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {}
}

let state = {
  started: false,
  scene: 'yard', // 'yard' | 'living' | 'room'
  entry: 'start', // 어느 장면에서 들어왔는지 (스폰 위치 결정)
  fading: false,
  near: [], // 근처에 있는 상호작용 지점 id 목록
  pose: 'stand', // 'stand' | 'sit' | 'prone'
  bubble: null, // { who, text, id }
  brother: { phase: 'idle', reply: '' }, // 'idle' | 'ask' | 'replied'
  volume: 0.8,
  muted: false,
  toast: null,
  fx: {}, // { dog: timestamp, squirrel: timestamp, ... } 애니메이션 트리거
  showHint: true,
  // ----- 확장 기능 -----
  time: 'rain', // 'rain' | 'sunset' | 'night'
  modal: null, // 'letter' | 'turntable' | 'notebook'
  letterIdx: 0,
  tangerines: 0, // 평상 바구니 속 귤
  treeFruit: 40, // 나무에 남은 귤
  cooking: null, // { dish, start, dur }
  served: null, // 'kimchi' | 'ramen'
  tv: 0, // TV 채널
  roomTrack: 'musicbox', // 'musicbox' | 'piano' | 'lofi' | 'off'
  snacks: {}, // { '🍠': 2, ... }
  offers: {}, // { mom: { phase, snack } }
  diary: loadJSON('sigol-diary', []),
  notes: loadJSON('sigol-notes', [
    { id: 1, kind: 'quote', text: '오늘도 충분히 잘했어 🌿', done: false, pinned: true },
    { id: 2, kind: 'todo', text: '물 많이 마시기', done: false, pinned: true },
  ]),
}

export const getState = () => state

export function setState(partial) {
  const next = typeof partial === 'function' ? partial(state) : partial
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** selector 는 원시값이나 state 안에 이미 있는 참조만 반환해야 합니다. */
export function useStore(selector) {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}
