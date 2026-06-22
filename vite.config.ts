import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'node22',
    lib: {
      entry: resolve(__dirname, 'src/cli.ts'),
      formats: ['es'],
      fileName: 'cli',
    },
    rollupOptions: {
      external: [
        'node:crypto',
        'node:os',
        'node:path',
        'node:fs',
        'node:fs/promises',
        'node:url',
        'node:util',
        'node:child_process',
        'node:process',
        'commander',
        '@clack/prompts',
      ],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
  },
})
