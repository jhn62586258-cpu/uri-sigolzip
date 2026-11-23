import React from 'react'
import { useStore } from '../lib/store'
import { SCENES } from '../scenes/config'
import { goTo, playSpot, talkTo, runAction } from '../lib/actions'

/** 캐릭터가 소품/문/가족 근처에 가면 자동으로 뜨는 큰 버튼들 */
export default function ProximityButtons() {
  const near = useStore((s) => s.near)
  const scene = useStore((s) => s.scene)
  const pose = useStore((s) => s.pose)
  const modal = useStore((s) => s.modal)
  const cfg = SCENES[scene]
  const items = []
  near.forEach((id) => {
    if (id.startsWith('npc:')) {
      const npc = cfg.npcs.find((n) => 'npc:' + n.id === id)
      if (npc && npc.id !== 'brother') items.push({ id, label: `💬 ${npc.name}랑 이야기하기`, run: () => talkTo(npc.id), kind: 'npc' })
      return
    }
    const s = cfg.spots.find((sp) => sp.id === id)
    if (!s) return
    if (s.kind === 'door') items.push({ id, label: s.label, run: () => goTo(s.to), kind: 'door' })
    else if (s.kind === 'sound') items.push({ id, label: s.label, run: () => playSpot(s.sound), kind: 'sound' })
    else if (s.kind === 'action') {
      const label = s.action === 'tea' && pose === 'tea' ? '🧍 평상에서 일어나기' : s.label
      items.push({ id, label, run: () => runAction(s.action), kind: 'sound' })
    }
  })
  if (!items.length || modal) return null
  return (
    <div className="proximity">
      {items.map((it) => (
        <button key={it.id} className={'prox ' + it.kind} onClick={it.run}>
          {it.label}
        </button>
      ))}
    </div>
  )
}
