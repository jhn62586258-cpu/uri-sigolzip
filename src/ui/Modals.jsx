import React, { useState } from 'react'
import { useStore } from '../lib/store'
import { closeModal, nextLetter, saveDiary, deleteDiary, selectTrack, saveNotes, toast } from '../lib/actions'
import { LETTERS, TRACKS } from '../scenes/config'

function Sheet({ title, children, onClose, className = '' }) {
  return (
    <div className="modal-back" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal ' + className}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const today = () => {
  const d = new Date()
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

// =============================================================
//  💌 우체통: 엄마·아빠 편지 + 답장/일기
// =============================================================
function LetterModal() {
  const idx = useStore((s) => s.letterIdx)
  const diary = useStore((s) => s.diary)
  const [tab, setTab] = useState('read')
  const [to, setTo] = useState('mom')
  const [text, setText] = useState('')
  const i = Math.max(0, idx - 1)
  const from = i % 2 === 0 ? 'mom' : 'dad'
  const list = LETTERS[from]
  const body = list[Math.floor(i / 2) % list.length]

  const save = () => {
    if (!text.trim()) return
    saveDiary({ to, text: text.trim(), date: today() })
    setText('')
    toast(to === 'diary' ? '오늘의 일기를 우체통에 넣었어요 📔' : to === 'mom' ? '엄마가 답장을 읽고 활짝 웃었어요 😊' : '아빠가 답장을 몇 번이나 다시 읽었대요 🥹')
  }
  const TO = { mom: '엄마에게', dad: '아빠에게', diary: '오늘의 일기' }
  return (
    <Sheet title="💌 우체통" onClose={closeModal} className="letter">
      <div className="tabs">
        <button className={tab === 'read' ? 'on' : ''} onClick={() => setTab('read')}>
          💌 받은 편지
        </button>
        <button className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>
          ✍️ 답장 · 오늘의 일기
        </button>
      </div>
      {tab === 'read' ? (
        <div className="paper" key={idx}>
          <div className="paper-to">사랑하는 우리 딸에게</div>
          <p>{body}</p>
          <div className="paper-from">
            {today()} · {from === 'mom' ? '엄마가 🌷' : '아빠가 🌿'}
          </div>
          <button className="primary" onClick={nextLetter}>
            {from === 'mom' ? '아빠 편지도 열어보기 ✉️' : '엄마 편지도 열어보기 ✉️'}
          </button>
        </div>
      ) : (
        <div className="write">
          <div className="seg">
            {Object.entries(TO).map(([k, v]) => (
              <button key={k} className={to === k ? 'on' : ''} onClick={() => setTo(k)}>
                {v}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            maxLength={400}
            onChange={(e) => setText(e.target.value)}
            placeholder={to === 'diary' ? '오늘 있었던 일, 고마웠던 일을 적어보세요…' : `${TO[to]} 하고 싶은 말을 적어보세요…`}
          />
          <button className="primary" onClick={save} disabled={!text.trim()}>
            우체통에 넣기 📮
          </button>
          <div className="diary-list">
            {diary.length === 0 && <div className="empty">아직 쓴 편지가 없어요.</div>}
            {diary.map((d) => (
              <div key={d.id} className="diary-item">
                <div className="meta">
                  {TO[d.to]} · {d.date}
                  <button onClick={() => deleteDiary(d.id)} aria-label="삭제">
                    🗑
                  </button>
                </div>
                <div>{d.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}

// =============================================================
//  💿 턴테이블
// =============================================================
function TurntableModal() {
  const track = useStore((s) => s.roomTrack)
  return (
    <Sheet title="💿 오늘의 LP 고르기" onClose={closeModal}>
      <div className="records">
        {TRACKS.map((t) => (
          <button key={t.id} className={'record' + (track === t.id ? ' on' : '')} onClick={() => selectTrack(t.id)}>
            <span className="disc" style={{ '--c': t.color }} />
            <span className="rt">
              <b>{t.name}</b>
              <small>{t.desc}</small>
            </span>
            {track === t.id && <span className="now">재생 중</span>}
          </button>
        ))}
        <button className={'record off' + (track === 'off' ? ' on' : '')} onClick={() => selectTrack('off')}>
          <span className="disc" style={{ '--c': '#bbb' }} />
          <span className="rt">
            <b>음악 끄기</b>
            <small>조용히 꼬마전구만 바라보기</small>
          </span>
        </button>
      </div>
    </Sheet>
  )
}

// =============================================================
//  📖 노트: 힐링 문구 · 오늘 할 일 → 코르크보드에 꽂기
// =============================================================
function NotebookModal() {
  const notes = useStore((s) => s.notes)
  const [tab, setTab] = useState('quote')
  const [text, setText] = useState('')
  const list = notes.filter((n) => n.kind === tab)
  const add = () => {
    if (!text.trim()) return
    saveNotes([{ id: Date.now(), kind: tab, text: text.trim().slice(0, 40), done: false, pinned: true }, ...notes])
    setText('')
  }
  const update = (id, patch) => saveNotes(notes.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  const remove = (id) => saveNotes(notes.filter((n) => n.id !== id))
  const pinnedCount = notes.filter((n) => n.pinned).length
  return (
    <Sheet title="📖 나의 책상 노트" onClose={closeModal} className="notebook">
      <div className="tabs">
        <button className={tab === 'quote' ? 'on' : ''} onClick={() => setTab('quote')}>
          🌿 힐링 문구
        </button>
        <button className={tab === 'todo' ? 'on' : ''} onClick={() => setTab('todo')}>
          ✅ 오늘 할 일
        </button>
      </div>
      <div className="addrow">
        <input
          value={text}
          maxLength={40}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={tab === 'quote' ? '예) 천천히 가도 괜찮아' : '예) 산책 20분 하기'}
        />
        <button className="primary" onClick={add}>
          적기
        </button>
      </div>
      <div className="note-list">
        {list.length === 0 && <div className="empty">아직 적은 내용이 없어요.</div>}
        {list.map((n) => (
          <div key={n.id} className={'note-item' + (n.done ? ' done' : '')}>
            {n.kind === 'todo' && <input type="checkbox" checked={n.done} onChange={() => update(n.id, { done: !n.done })} />}
            <span className="nt">{n.text}</span>
            <button className={'pin' + (n.pinned ? ' on' : '')} onClick={() => update(n.id, { pinned: !n.pinned })} title="책상 코르크보드에 꽂기">
              📌
            </button>
            <button onClick={() => remove(n.id)} aria-label="삭제">
              🗑
            </button>
          </div>
        ))}
      </div>
      <p className="hint-small">📌 꽂아둔 메모는 책상 옆 코르크보드에 최대 6장까지 붙어요. (지금 {Math.min(6, pinnedCount)}장)</p>
    </Sheet>
  )
}

export default function Modals() {
  const modal = useStore((s) => s.modal)
  if (modal === 'letter') return <LetterModal />
  if (modal === 'turntable') return <TurntableModal />
  if (modal === 'notebook') return <NotebookModal />
  return null
}
