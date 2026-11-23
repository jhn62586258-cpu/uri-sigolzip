import { useSyncExternalStore } from 'react'

// 아주 작은 전역 상태 저장소 (외부 라이브러리 없이)
const listeners = new Set()

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
