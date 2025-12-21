<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

//定义心情变量
const currentTheme=ref('default')

// 初始化编辑器
const editor = useEditor({
  extensions: [
    StarterKit,
  ],
  content: `
    <p>你好！我是你的 <b>Vue AI 灵感助手</b>。</p>
    <p>在这里输入内容，点击下方的按钮体验交互...</p>
  `,
  editorProps: {
    attributes: {
      // 这里用 Tailwind 类名控制样式
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none border p-4 rounded-lg min-h-[300px] shadow-sm bg-white',
    },
  },
})

// 模拟一个 AI 交互函数
const runAI = () => {
  if (!editor.value) return
  
  // 获取当前选中的文本（如果没有选中，就追加）
  const { from, to } = editor.value.state.selection
  
  // 模拟 AI 思考中...
   setTimeout(() => {
    editor.value.chain().focus().insertContent(' [AI正在思考...] ').run()
   },1000)
  setTimeout(() => {
    // 模拟 AI 返回结果
    editor.value.chain().focus().insertContent('✨ 作业还是要自己写！😉😉😉').run()
  }, 1000)
}

// 这里的类名都是 Tailwind 的
const themes = {
  default: 'bg-gray-50 text-gray-800',
  happy: 'bg-gradient-to-r from-yellow-200 to-orange-100 text-orange-800', // 暖色渐变
  sad: 'bg-slate-800 text-white', // 深色背景，白字
  angry: 'bg-indigo-950 text-indigo-200', // 深蓝夜空
}

const analyzeMood=()=>{
  if (!editor.value) return 
  // 1.拿到编辑器里的纯文本
  const text=editor.value.getText()
  // console.log(text)

  // 2.简单的关键词匹配（假装是AI在分析情感）
  if (text.includes('开心')||text.includes('快乐')||text.includes('兴奋')){
    currentTheme.value='happy'
  }else if (text.includes('难过')||text.includes('伤心')||text.includes('失落')){
    currentTheme.value='sad'
  }else if (text.includes('生气')||text.includes('愤怒')||text.includes('气愤')){
    currentTheme.value='angry'
  }else{
    currentTheme.value='default'
  }

}

// 销毁编辑器实例，防止内存泄漏
onBeforeUnmount(() => {
  editor.value.destroy()
})
</script>

<template>
  <div :class="['min-h-screen p-8 transition-colors duration-500', themes[currentTheme]]">
    <h1 class="text-3xl font-bold mb-6 text-emerald-600">Vue 3 + AI Editor Demo</h1>

    <!-- 只有当编辑器加载完成后，才显示按钮栏 -->
    <div v-if="editor" class="mb-4 flex gap-3">
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

      <button @click="analyzeMood" class="px-3 py-1 border rounded hover:opacity-90 transition">
         🎨 AI 换肤

      </button>

      <!-- AI 按钮 (核心卖点) -->
      <button 
        @click="runAI"
        class="ml-auto px-4 py-1 border rounded bg-emerald-100 text-emerald-700 font-bold border-emerald-300 hover:bg-emerald-200 transition flex items-center gap-2"
      >
        <span>✨ 魔法变身</span>
      </button>
    </div>

    <!-- 编辑器渲染区域 -->
    <editor-content :editor="editor" />
    
    <div class="mt-8 text-sm text-gray-500 text-center">
      技术栈: Vue 3 + Vite + Tailwind CSS + Tiptap
    </div>
  </div>
</template>

