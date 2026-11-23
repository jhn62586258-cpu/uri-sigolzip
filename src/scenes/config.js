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
      { id: 'harvest', kind: 'action', action: 'harvest', x: 5.5, z: -5.0, r: 2.7, label: '🍊 귤 수확하기' },
      { id: 'squirrel', kind: 'sound', sound: 'squirrel', x: 5.5, z: -5.0, r: 3.2, label: '🐿️ 다람쥐 소리 듣기' },
      { id: 'dogs', kind: 'action', action: 'petDogs', x: 5.8, z: -0.6, r: 3.0, label: '🐶 강아지 쓰다듬기 / 멍멍 소리 듣기' },
      { id: 'mailbox', kind: 'action', action: 'letter', x: 9.4, z: -0.1, r: 1.8, label: '💌 우체통 열어보기' },
      { id: 'bench', kind: 'action', action: 'tea', x: -8.3, z: -3.8, r: 1.9, label: '🍵 평상에서 티타임' },
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
      { id: 'tv', kind: 'action', action: 'channel', x: -2.0, z: -2.5, r: 1.55, label: '📺 채널 돌리기' },
      { id: 'cook-kimchi', kind: 'action', action: 'cook:kimchi', x: 3.1, z: -2.55, r: 1.9, label: '🍲 김치찌개 끓이기' },
      { id: 'cook-ramen', kind: 'action', action: 'cook:ramen', x: 3.1, z: -2.55, r: 1.9, label: '🍜 라면 끓이기' },
      { id: 'poodle', kind: 'action', action: 'hug', x: -3.4, z: -0.55, r: 1.6, label: '🐩 푸들 안아주기' },
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
      { id: 'notebook', kind: 'action', action: 'notebook', x: -0.3, z: -1.45, r: 1.35, label: '📖 방명록 · 할 일 쓰기' },
      { id: 'turntable', kind: 'action', action: 'turntable', x: 2.45, z: -1.95, r: 1.6, label: '💿 LP 턴테이블 고르기' },
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

// ---------- 엄마·아빠가 건네주는 간식 ----------
export const OFFERS = {
  mom: [
    { emoji: '🍠', name: '군고구마', line: '우리 딸 왔어? 방금 구운 군고구마야. 뜨거우니까 호호 불어서 먹어~' },
    { emoji: '🥞', name: '김치전', line: '비 오는 날엔 전이지! 엄마가 바삭하게 부쳤어 😊' },
    { emoji: '🍊', name: '귤', line: '귤 까놨다~ 손 노래지기 전에 엄마가 까줄게.' },
  ],
  dad: [
    { emoji: '🌰', name: '군밤', line: '아빠가 난로에 군밤 구웠지~ 하나 먹어볼래?' },
    { emoji: '🍊', name: '귤', line: '요거 제일 달아 보이는 걸로 골라놨다. 너 줄려고 😆' },
    { emoji: '🍡', name: '약과', line: '쉿, 엄마 몰래 하나 더 먹어. 아빠랑 비밀이다?' },
  ],
}

// ---------- 우체통 편지 ----------
export const LETTERS = {
  mom: [
    '우리 딸, 오늘 하루도 정말 고생 많았어. 밥은 꼭 챙겨 먹고, 힘든 일 있으면 언제든 엄마한테 기대도 돼. 사랑해.',
    '네가 웃으면 엄마는 그날 하루가 다 괜찮아져. 너무 잘하려고 애쓰지 않아도 돼. 지금 그대로도 충분히 예뻐.',
    '오늘은 따뜻한 물로 샤워하고 일찍 자렴. 이불 속이 제일 안전한 곳이라는 거, 엄마는 다 알아. 푹 자고 내일 보자.',
    '가끔은 울어도 괜찮아. 울고 나서 밥 한 숟갈 먹으면 또 힘이 나. 엄마가 된장찌개 끓여놓을게.',
  ],
  dad: [
    '오늘도 묵묵히 버텨내느라 수고했다. 네가 어디서 무얼 하든 아빠는 늘 네 편인 거 알지? 푹 쉬어라.',
    '아빠가 말은 잘 못 해도, 너는 아빠의 제일 큰 자랑이다. 천천히 가도 괜찮아. 멈춰 쉬는 것도 길이야.',
    '세상이 너한테 조금 거칠게 굴어도 집에 오면 아빠가 있잖아. 마당 평상에 앉아서 귤 까먹자.',
    '오늘 하늘 봤니? 바쁜 날일수록 하늘 한 번 올려다봐라. 아빠도 같은 하늘 보면서 네 생각 한다.',
  ],
}

export const TV_CHANNELS = ['🏞️ 시골 풍경 다큐', '🔥 모닥불 영상', '🌧️ 비 오는 숲', '🐣 말랑 만화']

export const TRACKS = [
  { id: 'musicbox', name: '따뜻한 오르골', desc: '꼬마전구 아래 반짝이는 자장가', color: '#e8b45a' },
  { id: 'piano', name: '새벽 피아노', desc: '조용한 새벽, 느린 피아노 아르페지오', color: '#7f9bbd' },
  { id: 'lofi', name: '로파이 빗소리', desc: '빗소리 + 지지직 LP + 느긋한 비트', color: '#8a7a6a' },
]

export const DISHES = {
  kimchi: { name: '김치찌개', emoji: '🍲', color: '#c4462c' },
  ramen: { name: '라면', emoji: '🍜', color: '#e0a23c' },
}
