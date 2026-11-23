// =============================================================
//  장면별 설정: 카메라, 스폰 위치, 근접 상호작용 지점, 가족(NPC)
//  heading: 캐릭터가 바라보는 방향 (0 = +z, π = -z)
//  yaw: 카메라 위치 각도 (0 = 캐릭터 기준 +z 쪽에서 -z 방향을 바라봄)
// =============================================================
const PI = Math.PI

export const SCENES = {
  yard: {
    name: '우리집 마당',
    icon: '🌳',
    ambience: 'rain',
    camera: { fov: 55, dist: 9, minDist: 2.4, maxDist: 18, pitch: 0.42 },
    spawns: {
      start: { x: 1.5, z: 3.2, heading: PI, yaw: 0 },
      living: { x: -5.5, z: -3.4, heading: 0, yaw: 0 },
    },
    spots: [
      { id: 'door-living', kind: 'door', x: -5.5, z: -4.2, r: 1.7, label: '🚪 거실로 들어가기', to: 'living' },
      { id: 'squirrel', kind: 'sound', sound: 'squirrel', x: 5.5, z: -5.0, r: 3.2, label: '🐿️ 다람쥐 소리 듣기' },
      { id: 'dog', kind: 'sound', sound: 'dog', x: 5.4, z: -0.6, r: 2.3, label: '🐶 강아지 소리 듣기' },
    ],
    npcs: [],
  },
  living: {
    name: '거실과 부엌',
    icon: '🛋️',
    ambience: 'home',
    camera: { fov: 62, dist: 6.6, minDist: 1.6, maxDist: 11, pitch: 0.36 },
    // 카메라 경계: 좌우/뒤/천장은 방 안쪽으로 제한, 앞쪽(+z)은 앞벽이 투명 처리되므로 열어 둠
    bounds: { minX: -4.8, maxX: 4.8, minZ: -3.3, maxZ: 7.5, maxY: 4.15 },
    spawns: {
      start: { x: -3.3, z: 2.3, heading: PI, yaw: 0.25 },
      yard: { x: -3.3, z: 2.3, heading: PI, yaw: 0.25 },
      room: { x: 3.3, z: 2.5, heading: -PI / 2, yaw: 0 },
    },
    spots: [
      { id: 'door-yard', kind: 'door', x: -4.5, z: 2.3, r: 1.05, label: '🌳 마당으로 나가기', to: 'yard' },
      { id: 'door-room', kind: 'door', x: 4.5, z: 2.5, r: 1.05, label: '🚪 내 방으로 들어가기', to: 'room' },
      { id: 'kettle', kind: 'sound', sound: 'kettle', x: 0.6, z: -3.05, r: 1.65, label: '🫖 물 끓는 소리 듣기' },
    ],
    npcs: [
      { id: 'mom', name: '엄마', x: 3.1, z: -2.55, r: 1.7 },
      { id: 'dad', name: '아빠', x: -2.3, z: 0.25, r: 1.95 },
    ],
  },
  room: {
    name: '내 방 아지트',
    icon: '🧸',
    ambience: 'musicbox',
    camera: { fov: 64, dist: 5.4, minDist: 1.4, maxDist: 9, pitch: 0.34 },
    bounds: { minX: -2.8, maxX: 2.8, minZ: -2.3, maxZ: 6.0, maxY: 3.75 },
    spawns: {
      start: { x: 1.4, z: 0.9, heading: PI, yaw: 0 },
      living: { x: 1.4, z: 0.9, heading: PI, yaw: 0 },
    },
    spots: [
      { id: 'door-living', kind: 'door', x: 2.5, z: 0.8, r: 1.0, label: '🛋️ 거실로 나가기', to: 'living' },
      { id: 'pencil', kind: 'sound', sound: 'pencil', x: 1.0, z: -1.4, r: 1.45, label: '✏️ 연필 사각사각 쓰기' },
    ],
    npcs: [{ id: 'brother', name: '오빠', x: -2.25, z: 1.95, r: 2.0 }],
    hideout: { x: 0.4, z: -1.85 },
  },
}

export const SCENE_ORDER = ['yard', 'living', 'room']

export const NPC_LINES = {
  mom: [
    '된장찌개 보글보글~ 냄새 좋지? 😊',
    '우리 애기 배고프지? 조금만 기다려~',
    '밥 다 됐다~ 손 씻고 와!',
    '감 깎아줄까? 마당 감나무에서 딴 거야 🍊',
  ],
  dad: [
    '우리 강아지 왔어? 이리 와서 같이 TV 보자~',
    '비 오는 날엔 역시 부침개지! 엄마한테 해달라 그럴까? 😆',
    '아빠 안경 어디 갔지...? 아, 쓰고 있구나 허허',
    '오늘도 잘 놀았어? 우리 딸 최고다 👍',
  ],
  brother: ['뭐야, 또 왔냐? ㅋㅋ', '이번 판 끝나면 놀아줄게~', '과자 반 줄까? 🍪'],
}

export const BROTHER_CHOICES = [
  { label: '그냥 놀러 왔지~ 😝', reply: 'ㅋㅋ 그래 놀다 가라~ 과자 줄까? 🍪' },
  { label: '오빠 게임해? 🎮', reply: '어. 이번 판만 하고 같이 하자!' },
  { label: '저리 가! 😤', reply: '아 알았어 알았어~ 😅 (여긴 내 방인데...)' },
]
