import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 검색 API
      '/api/search': {
        target: 'https://openapi.naver.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/search/, '/v1/search/local.json'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Naver-Client-Id', 'xw1ec2l29o');
            proxyReq.setHeader('X-Naver-Client-Secret', 'SW5eOTStjgv2EV11WOu0wJJFYxz0QvFDYBZ1vXF0');
          });
        },
      },
      // 길찾기 API
      '/api/directions': {
        target: 'https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/directions/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-NCP-APIGW-API-KEY-ID', 'xw1ec2l29o');
            proxyReq.setHeader('X-NCP-APIGW-API-KEY', 'SW5eOTStjgv2EV11WOu0wJJFYxz0QvFDYBZ1vXF0');
          });
        },
      },
    },
  },
})