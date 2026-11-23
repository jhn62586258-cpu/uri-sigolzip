import React from 'react'
import { useStore } from '../lib/store'

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
    </>
  )
}
