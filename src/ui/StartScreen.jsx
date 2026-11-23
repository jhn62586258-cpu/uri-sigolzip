import React, { useState } from 'react'
import { audio } from '../audio/AudioEngine'
import { setState, getState } from '../lib/store'
import { SCENES } from '../scenes/config'

export default function StartScreen() {
  const [leaving, setLeaving] = useState(false)

  const enter = (withSound) => {
    // ⚠️ AudioContext 생성/resume 은 반드시 이 클릭 핸들러 안에서 동기적으로 실행되어야
    //    브라우저 자동재생 차단에 걸리지 않습니다.
    const s = getState()
    audio.unlock()
    audio.setMuted(!withSound)
    audio.setVolume(s.volume)
    audio.setAmbience(SCENES[s.scene].ambience)
    if (withSound) audio.play('click')
    setLeaving(true)
    setTimeout(() => setState({ started: true, muted: !withSound }), 450)
    setTimeout(() => setState({ showHint: false }), 9000)
  }

  return (
    <div className={'start' + (leaving ? ' leaving' : '')}>
      <div className="start-card">
        <div className="start-emoji">🏡</div>
        <h1>우리 시골집</h1>
        <p className="start-sub">
          빗소리 들리는 마당, 찌개 끓는 부엌,
          <br />
          꼬마전구 반짝이는 내 방 아지트로 놀러 오세요.
        </p>
        <button className="start-btn" onClick={() => enter(true)}>
          🔊 소리 켜기 / 집으로 들어가기
        </button>
        <button className="start-quiet" onClick={() => enter(false)}>
          소리 없이 들어가기
        </button>
        <ul className="start-help">
          <li>🕹️ 조이스틱 · WASD · 바닥 클릭으로 이동</li>
          <li>👆 드래그로 둘러보기 · 🤏 두 손가락 핀치 / 휠로 확대·축소</li>
          <li>🚪 문을 누르거나 가까이 가서 버튼을 눌러 다른 방으로</li>
        </ul>
      </div>
    </div>
  )
}
