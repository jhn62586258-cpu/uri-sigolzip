import React, { useRef } from 'react'
import { input } from '../lib/shared'

const R = 46

export default function Joystick() {
  const base = useRef()
  const knob = useRef()
  const active = useRef(null)

  const update = (e) => {
    const rect = base.current.getBoundingClientRect()
    let dx = e.clientX - (rect.left + rect.width / 2)
    let dy = e.clientY - (rect.top + rect.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) {
      dx = (dx / d) * R
      dy = (dy / d) * R
    }
    input.joy.x = dx / R
    input.joy.y = dy / R
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`
  }
  const down = (e) => {
    e.preventDefault()
    e.stopPropagation()
    active.current = e.pointerId
    base.current.setPointerCapture(e.pointerId)
    update(e)
  }
  const move = (e) => {
    if (active.current !== e.pointerId) return
    update(e)
  }
  const up = (e) => {
    if (active.current !== e.pointerId) return
    active.current = null
    input.joy.x = 0
    input.joy.y = 0
    knob.current.style.transform = 'translate(0px, 0px)'
  }

  return (
    <div className="joystick" ref={base} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <div className="knob" ref={knob} />
    </div>
  )
}
