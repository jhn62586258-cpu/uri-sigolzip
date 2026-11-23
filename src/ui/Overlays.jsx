import React, { useEffect, useState } from 'react'

import { useStore } from '../lib/store'
import { DISHES } from '../scenes/config'

function CookBar() {
  const cooking = useStore((s) => s.cooking)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!cooking) return
    const id = setInterval(() => tick((v) => v + 1), 200)
    return () => clearInterval(id)
  }, [cooking])
  if (!cooking) return null
  const p = Math.min(1, (performance.now() - cooking.start) / cooking.dur)
  const d = DISHES[cooking.dish]
  return (
    <div className="cookbar">
      <span>
        {d.emoji} {d.name} 보글보글… {Math.round(p * 100)}%
      </span>
      <div className="bar">
        <i style={{ width: `${p * 100}%` }} />
      </div>
    </div>
  )
}

export default function Overlays() {
  const fading = useStore((s) => s.fading)
  const toast = useStore((s) => s.toast)
  const showHint = useStore((s) => s.showHint)
  const started = useStore((s) => s.started)
  return (
    <>
      <div className={'fade' + (fading ? ' on' : '')} />
      {started && showHint && <div className="hint">바닥 클릭 · 조이스틱 이동 · 드래그로 둘러보기 · 휠/핀치 확대·축소</div>}
      {toast && <div className="toast">{toast}</div>}
      {started && <CookBar />}
    </>
  )
}
