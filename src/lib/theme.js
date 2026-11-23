import { useStore } from './store'

// =============================================================
//  시간대 · 날씨 테마 (우측 상단 버튼으로 실시간 전환)
// =============================================================
export const THEMES = {
  rain: {
    label: '🌧️ 비 오는 낮',
    sky: 'sky',
    view: 'viewRain',
    fog: '#d3d1c8',
    fogRange: [24, 95],
    exposure: 1.05,
    yard: { hemi: ['#e2e6ea', '#7d8a55', 0.95], amb: 0.25, sun: '#ffe7c4', sunI: 1.35, sunPos: [9, 15, 9] },
    indoor: { hemi: ['#fff3e2', '#7a5e46', 0.6], amb: 0.38, sun: '#fff0d8', sunI: 0.9, lamp: 1, bg: '#2a211b' },
    rain: true,
    fireflies: false,
  },
  sunset: {
    label: '🌅 노을 저녁',
    sky: 'skySunset',
    view: 'sunset',
    fog: '#eab991',
    fogRange: [26, 100],
    exposure: 1.0,
    yard: { hemi: ['#ffd7b0', '#6e5a3c', 0.8], amb: 0.2, sun: '#ffa45e', sunI: 2.1, sunPos: [16, 6, -10] },
    indoor: { hemi: ['#ffd9b5', '#6a4a35', 0.5], amb: 0.3, sun: '#ffab6a', sunI: 1.5, lamp: 1.15, bg: '#2c1e16' },
    rain: false,
    fireflies: false,
  },
  night: {
    label: '🌙 별빛 밤',
    sky: 'skyNight',
    view: 'viewNight',
    fog: '#1a2036',
    fogRange: [18, 80],
    exposure: 1.15,
    yard: { hemi: ['#5a6aa0', '#1c1c24', 0.45], amb: 0.12, sun: '#a9bcff', sunI: 0.55, sunPos: [-8, 14, 6] },
    indoor: { hemi: ['#4a5580', '#2a1e18', 0.25], amb: 0.16, sun: '#9fb2ff', sunI: 0.2, lamp: 1.5, bg: '#14100e' },
    rain: false,
    fireflies: true,
  },
}

export const TIME_ORDER = ['rain', 'sunset', 'night']

export function useTheme() {
  const t = useStore((s) => s.time)
  return THEMES[t]
}
