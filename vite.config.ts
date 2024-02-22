// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vite" />
import path from 'path'
import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    dts(),
    tsconfigPaths(),
  ],
  build: {
    manifest: true,
    minify: true,
    reportCompressedSize: true,
    lib: {
      name: 'blend',
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: format => (format === 'es' ? 'index.mjs' : `index.${format}.js`),
    },
    rollupOptions: {
      external: [
        'node:fs',
        'node:path',
        'node:child_process',
        'os',
        'path',
        'fs',
        'constants',
        'url',
        'assert',
      ],
      plugins: [
        typescriptPaths({
          preserveExtensions: true,
        }),
        typescript({
          sourceMap: false,
          declaration: true,
          outDir: 'dist',
        }),
      ],
    },
  },
})
