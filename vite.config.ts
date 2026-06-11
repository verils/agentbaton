import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'node22',  // 目标是 Node.js，不是浏览器
    lib: {
      entry: resolve(__dirname, 'src/cli.ts'),
      formats: ['es'],
      fileName: 'cli',
    },
    rollupOptions: {
      // 外部化所有 Node.js 内置模块和依赖
      external: [
        // Node.js 内置模块
        'node:crypto',
        'node:os',
        'node:path',
        'node:fs',
        'node:fs/promises',
        'node:url',
        'node:util',
        'node:child_process',
        'node:process',
        // npm 依赖
        'commander',
        '@clack/prompts',
        'yaml',
        'chalk',
      ],
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,  // CLI 工具不需要压缩，方便调试
  },
})
