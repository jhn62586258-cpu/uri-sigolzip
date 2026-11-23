import React, { useState } from 'react'
import { useStore, setState } from '../lib/store'
import { SCENES, SCENE_ORDER } from '../scenes/config'
import { goTo, setTime } from '../lib/actions'
import { THEMES, TIME_ORDER } from '../lib/theme'
import { audio } from '../audio/AudioEngine'

export default function TopBar() {
  const scene = useStore((s) => s.scene)
  const muted = useStore((s) => s.muted)
  const volume = useStore((s) => s.volume)
  const time = useStore((s) => s.time)
  const snacks = useStore((s) => s.snacks)
  const snackList = Object.entries(snacks)
  const [open, setOpen] = useState(false)

  const toggleMute = () => {
    audio.unlock()
    audio.setMuted(!muted)
    setState({ muted: !muted })
  }
  const onVol = (e) => {
    const v = parseFloat(e.target.value)
    audio.unlock()
    audio.setVolume(v)
    if (muted && v > 0) audio.setMuted(false)
    setState({ volume: v, muted: v === 0 ? true : false })
  }

  return (
    <>
      <div className="topbar left">
        <button className="pill icon" title="처음 화면으로" onClick={() => setState({ started: false })}>
          ↩
        </button>
        <div className="dropdown">
          <button className="pill" onClick={() => setOpen((o) => !o)}>
            <span>{SCENES[scene].icon}</span> {SCENES[scene].name} <span className={'chev' + (open ? ' up' : '')}>⌄</span>
          </button>
          {open && (
            <div className="menu">
              {SCENE_ORDER.map((k) => (
                <button
                  key={k}
                  className={k === scene ? 'active' : ''}
                  onClick={() => {
                    setOpen(false)
                    goTo(k)
                  }}
                >
                  {SCENES[k].icon} {SCENES[k].name}
                </button>
              ))}
            </div>
          )}
        </div>
        {snackList.length > 0 && (
          <div className="pill snacks" title="받은 간식">
            {snackList.map(([e, n]) => (
              <span key={e}>
                {e}
                <small>{n}</small>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="topbar right">
        <div className="pill sound">
          <button className="mute" onClick={toggleMute} title={muted ? '소리 켜기' : '음소거'}>
            {muted || volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : '🔊'}
          </button>
          <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={onVol} aria-label="음량" />
        </div>
        <div className="timebar">
          {TIME_ORDER.map((k) => (
            <button key={k} className={'pill time' + (time === k ? ' on' : '')} onClick={() => setTime(k)}>
              {THEMES[k].label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
