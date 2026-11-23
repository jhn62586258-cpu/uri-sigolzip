import React, { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from './lib/store'
import { input } from './lib/shared'
import Player from './components/Player'
import CameraRig from './components/CameraRig'
import YardScene from './scenes/YardScene'
import LivingScene from './scenes/LivingScene'
import RoomScene from './scenes/RoomScene'
import StartScreen from './ui/StartScreen'
import TopBar from './ui/TopBar'
import ActionBar from './ui/ActionBar'
import ProximityButtons from './ui/ProximityButtons'
import Joystick from './ui/Joystick'
import Overlays from './ui/Overlays'

const SCENE_COMPONENTS = { yard: YardScene, living: LivingScene, room: RoomScene }

function World() {
  const scene = useStore((s) => s.scene)
  const Comp = SCENE_COMPONENTS[scene]
  return (
    <>
      <Comp key={scene} />
      <Player />
      <CameraRig />
    </>
  )
}

export default function App() {
  const started = useStore((s) => s.started)

  // 키보드 이동 (WASD / 방향키)
  useEffect(() => {
    const down = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return
      input.keys[e.code] = true
    }
    const up = (e) => (input.keys[e.code] = false)
    const blur = () => (input.keys = {})
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  return (
    <div className="app">
      <Canvas
        className="canvas"
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        camera={{ fov: 55, near: 0.05, far: 400, position: [0, 4, 10] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </Canvas>

      {started && (
        <>
          <TopBar />
          <ProximityButtons />
          <ActionBar />
          <Joystick />
        </>
      )}
      <Overlays />
      {!started && <StartScreen />}
    </div>
  )
}
