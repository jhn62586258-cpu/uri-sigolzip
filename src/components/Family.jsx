import React, { useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import { Chibi, LOOKS } from './Chibi'
import { Solid } from './Prims'
import { useStore, setState } from '../lib/store'
import { talkTo, offerSnack, clearOffer, acceptSnack } from '../lib/actions'
import { Hearts } from './Dogs'
import { audio } from '../audio/AudioEngine'
import { BROTHER_CHOICES } from '../scenes/config'

export function SpeechBubble({ y = 1.6, children, wide }) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[30, 20]}>
      <div className="bubble-anchor">
        <div className={'bubble' + (wide ? ' wide' : '')} onPointerDown={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </Html>
  )
}

function useBubble(id) {
  const bubble = useStore((s) => s.bubble)
  return bubble && bubble.who === id ? bubble.text : null
}


/** 다가가면 간식을 건네는 이벤트 */
function useOffer(id) {
  const near = useStore((s) => s.near)
  const offer = useStore((s) => s.offers[id])
  const isNear = near.includes('npc:' + id)
  const was = useRef(false)
  useEffect(() => {
    if (isNear && !was.current) offerSnack(id)
    if (!isNear && was.current) clearOffer(id)
    was.current = isNear
  }, [isNear])
  return offer
}

function NpcBubble({ id, name, text, offer, y }) {
  if (text)
    return (
      <SpeechBubble y={y}>
        <b>{name}</b>
        <span>{text}</span>
      </SpeechBubble>
    )
  if (offer?.phase === 'offer')
    return (
      <SpeechBubble y={y} wide>
        <b>{name}</b>
        <span>{offer.snack.line}</span>
        <div className="choices">
          <button onClick={() => acceptSnack(id)}>
            고마워요! {offer.snack.emoji} {offer.snack.name} 받기
          </button>
        </div>
      </SpeechBubble>
    )
  if (offer?.phase === 'given')
    return (
      <SpeechBubble y={y}>
        <b>{name}</b>
        <span>맛있게 먹어~ 💕</span>
      </SpeechBubble>
    )
  return null
}

const clickProps = (fn) => ({
  onClick: (e) => {
    e.stopPropagation()
    if (e.delta > 8) return
    fn()
  },
  onPointerOver: () => (document.body.style.cursor = 'pointer'),
  onPointerOut: () => (document.body.style.cursor = ''),
})

/** 엄마: 묶음 머리 + 니트 + 앞치마, 부엌에서 찌개를 저어요 */
export function Mom({ position, heading = Math.PI }) {
  const text = useBubble('mom')
  const offer = useOffer('mom')
  return (
    <>
      <group position={position} rotation={[0, heading, 0]} {...clickProps(() => talkTo('mom'))}>
        <Chibi look={LOOKS.mom} pose="cook" talking={!!text || offer?.phase === 'offer'} seed={1.3} />
        <group rotation={[0, -heading, 0]}>
          <NpcBubble id="mom" name="엄마" text={text} offer={offer} y={1.45} />
        </group>
        <Hearts fxKey="snack-mom" y={1.3} />
      </group>
      <Solid x={position[0]} z={position[2]} r={0.3} />
    </>
  )
}

/** 아빠: 둥근 안경 + 조끼, 소파에 앉아 TV 시청 (충돌은 소파가 담당) */
export function Dad({ position, heading = Math.PI }) {
  const text = useBubble('dad')
  const offer = useOffer('dad')
  return (
    <group position={position} rotation={[0, heading, 0]} {...clickProps(() => talkTo('dad'))}>
      <Chibi look={LOOKS.dad} pose="sitChair" talking={!!text || offer?.phase === 'offer'} seed={2.1} />
      <group rotation={[0, -heading, 0]}>
        <NpcBubble id="dad" name="아빠" text={text} offer={offer} y={1.45} />
      </group>
      <Hearts fxKey="snack-dad" y={1.3} />
    </group>
  )
}

/** 오빠: 후드티, 아지트 구석 빈백에서 게임 중. 가까이 가면 "야 모하냐?" */
export function Brother({ position, heading = 0 }) {
  const near = useStore((s) => s.near)
  const bro = useStore((s) => s.brother)
  const text = useBubble('brother')
  const isNear = near.includes('npc:brother')
  const wasNear = useRef(false)

  useEffect(() => {
    if (isNear && !wasNear.current) {
      setState({ brother: { phase: 'ask', reply: '' } })
      audio.play('talk', { pitch: 230, count: 5 })
    }
    if (!isNear && wasNear.current) setState({ brother: { phase: 'idle', reply: '' } })
    wasNear.current = isNear
  }, [isNear])

  const choose = (c) => {
    audio.play('talk', { pitch: 420, count: 4 })
    setState({ brother: { phase: 'replied', reply: c.reply, mine: c.label } })
    setTimeout(() => audio.play('talk', { pitch: 230, count: 8 }), 450)
  }

  const showAsk = bro.phase === 'ask'
  const showReply = bro.phase === 'replied'
  return (
    <>
      <group position={position} rotation={[0, heading, 0]} {...clickProps(() => talkTo('brother'))}>
        <Chibi look={LOOKS.brother} pose="game" holding="game" talking={showReply || !!text} seed={0.7} />
        <group rotation={[0, -heading, 0]}>
          {showAsk && (
            <SpeechBubble y={1.25} wide>
              <b>오빠</b>
              <span className="big">야 모하냐? 🙄</span>
              <div className="choices">
                {BROTHER_CHOICES.map((c) => (
                  <button key={c.label} onClick={() => choose(c)}>
                    {c.label}
                  </button>
                ))}
              </div>
            </SpeechBubble>
          )}
          {showReply && (
            <SpeechBubble y={1.25} wide>
              <small className="mine">나: {bro.mine}</small>
              <b>오빠</b>
              <span>{bro.reply}</span>
            </SpeechBubble>
          )}
          {!showAsk && !showReply && text && (
            <SpeechBubble y={1.25}>
              <b>오빠</b>
              <span>{text}</span>
            </SpeechBubble>
          )}
        </group>
      </group>
    </>
  )
}
