import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// iOS 사파리의 페이지 자체 확대(제스처)를 막아 핀치 줌이 3D 카메라에만 적용되게 합니다.
;['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
)
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault()
  },
  { passive: false }
)

createRoot(document.getElementById('root')).render(<App />)
