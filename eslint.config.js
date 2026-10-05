import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Architecture boundaries: docs/agents/00-shared-conventions.md. */

const rawPhysics = {
  name: '@react-three/rapier',
  importNames: [
    'RigidBody',
    'InstancedRigidBodies',
    'CuboidCollider',
    'BallCollider',
    'CapsuleCollider',
    'ConvexHullCollider',
    'TrimeshCollider',
    'MeshCollider',
    'CylinderCollider',
    'ConeCollider',
    'RoundCuboidCollider',
  ],
  message: 'Create bodies with World2D inside a contraption build() or Simulation, never in JSX (PLAN D1).',
}

const appFromGame = {
  group: ['@app/*', '**/app/*'],
  message: 'game/** must not import from app/**; communicate through GameBridge (PLAN D2).',
}

export default defineConfig(
  { ignores: ['dist', 'coverage', 'node_modules', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.{js,ts}', 'e2e/**'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/game/**'],
    rules: {
      // R3F mutates three.js objects (cameras, meshes, helpers) imperatively by design.
      'react-hooks/immutability': 'off',
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'localStorage', 'sessionStorage', 'alert'].map((name) => ({
          name,
          message: 'game/** is DOM-free so it can run in a worker (PLAN D2).',
        })),
      ],
      'no-restricted-imports': ['error', { paths: [rawPhysics], patterns: [appFromGame] }],
    },
  },
  {
    files: ['src/game/engine/physics/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [appFromGame] }],
    },
  },
  {
    files: ['src/app/**', 'src/main.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [rawPhysics],
          patterns: [
            {
              group: ['@game/*', '!@game/GameCanvas', '!@game/bridge/*', '**/game/*'],
              message: 'app/** may only import @game/GameCanvas and @game/bridge/* (PLAN D2).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@game/*', '@app/*', 'react', 'react-dom', 'three', '@react-three/*', '@dimforge/*'],
              message: 'shared/** is plain TypeScript with no framework or engine dependencies.',
            },
          ],
        },
      ],
    },
  },
)
