import * as THREE from 'three'

// 매 프레임 바뀌는 값들은 React 상태 대신 여기(가변 객체)에 둡니다.
export const player = {
  pos: new THREE.Vector3(0, 0, 0),
  heading: Math.PI,
  walking: false,
  target: null, // {x, z} 바닥 클릭 이동 목표
  pendingPose: null, // 목표 도착 후 취할 자세
  pendingHeading: null,
  stuckTime: 0,
}

export const input = {
  joy: { x: 0, y: 0 },
  keys: {},
}

export const cam = {
  yaw: 0,
  pitch: 0.38,
  dist: 6,
  targetDist: 6,
  minDist: 2,
  maxDist: 12,
  lastPinch: 0,
  dragging: false,
  lastDrag: 0,
  focusY: 0.72,
}

export const DEBUG = typeof window !== 'undefined' && /[?&]debug/.test(window.location.search)
