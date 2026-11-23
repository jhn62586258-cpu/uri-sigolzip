import React from 'react'
import { useStore } from '../lib/store'
import { setPose, talkNearest } from '../lib/actions'

export default function ActionBar() {
  const pose = useStore((s) => s.pose)
  const scene = useStore((s) => s.scene)
  return (
    <div className="actionbar">
      <button className={pose === 'sit' ? 'on' : ''} onClick={() => setPose('sit')}>
        <span className="ico">🌱</span>
        <span>{pose === 'sit' ? '일어나기' : '앉기'}</span>
      </button>
      <button className={pose === 'prone' ? 'on' : ''} onClick={() => setPose('prone')}>
        <span className="ico">🧸</span>
        <span>{pose === 'prone' ? '일어나기' : scene === 'room' ? '아지트 엎드리기' : '엎드리기'}</span>
      </button>
      <button onClick={talkNearest}>
        <span className="ico">💬</span>
        <span>대화하기</span>
      </button>
    </div>
  )
}
