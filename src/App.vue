<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

// 定义心情变量
const currentTheme = ref('default')
const isGenerating = ref(false)

// 初始化编辑器
const editor = useEditor({
  extensions: [
    StarterKit,
  ],
  // 1. 内容初始化（读档）
  content: localStorage.getItem('ai-draft') || `
    <p>你好！我是你的 <b>Vue AI 灵感助手</b>。</p>
    <p>试着在这里打字，然后刷新页面，你的内容不会丢失...</p>
  `,
  editorProps: {
    attributes: {
      // Tailwind 样式
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none border p-4 rounded-lg min-h-[300px] shadow-sm bg-white',
    },
  },
  // --- 修复点 1：onUpdate 必须写在 useEditor 的配置对象里面 ---
  onUpdate: ({ editor }) => {
    // 1. 获取html内容
    const html = editor.getHTML()
    // 2. 存到本地存储
    localStorage.setItem('ai-draft', html)
  }
})

// 模拟 AI 交互函数
// const runAI = () => {
//   if (!editor.value) return
  
//   // 模拟 AI 思考中...
//   editor.value.chain().focus().insertContent(' [AI正在思考...] ').run()
   
//   setTimeout(() => {
//     // 模拟 AI 返回结果（先删掉思考中的提示，再插入结果，或者直接追加）
//     editor.value.chain().focus().insertContent('✨ 作业还是要自己写！😉😉😉').run()
//   }, 1000)
// }
// 记得引入 ref (如果之前引过了就不用动)
// import { ref } from 'vue'

// 记得在最上面引入 ref： import { ref } from 'vue'
// const isGenerating = ref(false) // 加个状态锁，防止重复点

const runAI = async () => {
  // 1. 门卫检查：编辑器没好，或者正在生成中，就不让进
  if (!editor.value || isGenerating.value) return
  isGenerating.value = true // 上锁

  // 2. 拿到用户选中的字，没选中就拿全部
  const text = editor.value.state.selection.empty 
    ? editor.value.getText() 
    : editor.value.state.doc.textBetween(editor.value.state.selection.from, editor.value.state.selection.to)

  try {
    // 3. 拨打电话 (发送请求)
    // 注意：这里的 /api 是我们在 vite.config.js 里配好的暗号
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 去 .env 文件里拿你的 API Key (记得创建 .env 文件！)
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_KEY}` 
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: text }],
        stream: true // 重点：我要流式！
      })
    })

    // 4. 准备接收
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    // 5. 循环读取 (就像水管流水一样)
    while (true) {
      const { done, value } = await reader.read()
      if (done) break // 水流完了，关水龙头

      // 把二进制洗成文字
      const chunk = decoder.decode(value)
      // 这里的逻辑稍微复杂点，因为 AI 返回的是 JSON 字符串
      // 我们简单处理：提取 content 里的字
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6)) // 去掉 'data: '
            const content = data.choices[0].delta.content || ''
            // 把字写进编辑器
            editor.value.chain().insertContent(content).run()
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

  } catch (err) {
    alert('AI 出错了！请检查 API Key 或网络')
    console.error(err)
  } finally {
    isGenerating.value = false // 解锁，可以再次点击
  }
}

// 导出文件的函数
const exportFile = () => {
  if (!editor.value) return

  const content = editor.value.getHTML()
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `我的灵感笔记_${new Date().getTime()}.html`
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 主题样式配置
const themes = {
  default: 'bg-gray-50 text-gray-800',
  happy: 'bg-gradient-to-r from-yellow-200 to-orange-100 text-orange-800',
  sad: 'bg-slate-800 text-white',
  angry: 'bg-indigo-950 text-indigo-200',
}

// 简单的“AI”情感分析
const analyzeMood = () => {
  if (!editor.value) return 
  const text = editor.value.getText()

  if (text.includes('开心') || text.includes('快乐') || text.includes('兴奋')) {
    currentTheme.value = 'happy'
  } else if (text.includes('难过') || text.includes('伤心') || text.includes('失落')) {
    currentTheme.value = 'sad'
  } else if (text.includes('生气') || text.includes('愤怒') || text.includes('气愤')) {
    currentTheme.value = 'angry'
  } else {
    currentTheme.value = 'default'
  }
}

// 销毁编辑器实例
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<template>
  <div :class="['min-h-screen p-8 transition-colors duration-500', themes[currentTheme]]">
    <h1 class="text-3xl font-bold mb-6 text-emerald-600">Vue 3 + AI Editor Demo</h1>

    <!-- 只有当编辑器加载完成后，才显示按钮栏 -->
    <div v-if="editor" class="mb-4 flex flex-wrap gap-3 items-center">
      <!-- 加粗按钮 -->
      <button 
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'bg-gray-800 text-white': editor.isActive('bold') }"
        class="px-3 py-1 border rounded hover:bg-gray-100 transition"
      >
        B 加粗
      </button>

      <!-- 斜体按钮 -->
      <button 
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'bg-gray-800 text-white': editor.isActive('italic') }"
        class="px-3 py-1 border rounded hover:bg-gray-100 transition"
      >
        I 斜体
      </button>

      <button @click="editor.chain().focus().clearContent().run()" class="px-3 py-1 border rounded hover:opacity-80 transition">
        清空
      </button>

      <button @click="analyzeMood" class="px-3 py-1 border rounded hover:opacity-90 transition bg-white/50">
        🎨 AI 换肤
      </button>

      <!-- AI 按钮 -->
      <button 
        @click="runAI"
        class="ml-auto px-4 py-1 border rounded bg-emerald-100 text-emerald-700 font-bold border-emerald-300 hover:bg-emerald-200 transition flex items-center gap-2"
      >
        <span>✨ AI续写</span>
      </button>

      <!-- 修复点 2：修复了原来这里破碎的 HTML 标签 -->
      <button
        @click="exportFile"
        class="px-3 py-1 border rounded hover:bg-gray-100 transition flex items-center gap-1"
      >
        📥 导出
      </button>
    </div>

    <!-- 编辑器渲染区域 -->
    <editor-content :editor="editor" />

    <div class="mt-8 text-sm text-gray-500 text-center">
      技术栈: Vue 3 + Vite + Tailwind CSS + Tiptap
    </div>
  </div>
</template>