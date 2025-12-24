import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite' // 1. 引入这个

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // 2. 把它加到插件列表里
  ],
  server:{
    proxy:{
      // 只要我发请求给api，你就把我转发给ds
      '/api':{
        target:'https://api.deepseek.com',
        changeOrigin:true,//允许跨域
        rewrite:(path)=>path.replace(/^\/api/,'')//重写路径

      }
    }
  }
})