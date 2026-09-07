import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Config mínima só pra rodar os testes do motor de domínio (src/lib/media) — não builda a app,
// não sobe servidor, não toca a internet (providers são mockados nos testes).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // A implementação real de `server-only` lança incondicionalmente fora do build do
      // Next.js (o "silêncio" dela depende de substituição feita pelo bundler do Next) —
      // em teste isso é só um marcador, então troca por um módulo vazio.
      'server-only': path.resolve(__dirname, './vitest.server-only-stub.ts'),
    },
  },
  test: {
    environment: 'node',
  },
})
