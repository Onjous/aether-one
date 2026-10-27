import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Unused code is an error for project sources. (This lives in ESLint rather
    // than tsconfig's noUnusedLocals, which would also type-check the files
    // Next.js generates under .next/ and break `next build` during `next dev`.)
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // React Three Fiber's render loop mutates three.js objects (materials,
    // uniforms, transforms) inside `useFrame`, outside React's render phase,
    // and passes refs to scene-graph nodes. That is the library's intended
    // model, so the React Compiler purity rules are relaxed for 3D code only.
    files: ['src/three/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.playwright/**', 'qa/**']),
])

export default eslintConfig
