import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host: true → 같은 와이파이의 스마트폰에서 http://<PC IP>:5173 으로 바로 접속해 핀치 줌을 테스트할 수 있습니다.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: { chunkSizeWarningLimit: 2500 },
})
