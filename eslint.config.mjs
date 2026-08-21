import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-plugin-prettier/recommended';
import importX from 'eslint-plugin-import-x';
import boundaries from 'eslint-plugin-boundaries';
import unusedImports from 'eslint-plugin-unused-imports';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],

    plugins: {
      'import-x': importX,
      boundaries,
      'unused-imports': unusedImports,
    },

    settings: {
      'boundaries/elements': [
        {
          type: 'app',
          pattern: 'src/app/*',
        },
        {
          type: 'feature',
          pattern: 'src/features/*',
        },
        {
          type: 'shared',
          pattern: 'src/shared/*',
        },
      ],
    },

    rules: {
      '@typescript-eslint/no-explicit-any': 'error',

      // --- 未使用インポート・変数の制御 ---
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // --- import 順序 ---
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],

      // --- Bulletproof アーキテクチャの境界チェック ---
      // v7 で `boundaries/element-types` は deprecated（`boundaries/dependencies` へ置換）。
      // あわせて selector がオブジェクト形式に、`rules` オプションが `policies` に改称された。
      // 2026-08-21 に一括移行。挙動は移行前と同一
      // （app → feature / shared、feature → shared、shared → shared のみ許可）。
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: [
                { to: { element: { type: 'feature' } } },
                { to: { element: { type: 'shared' } } },
              ],
            },
            {
              from: { element: { type: 'feature' } },
              allow: [{ to: { element: { type: 'shared' } } }],
            },
            {
              from: { element: { type: 'shared' } },
              allow: [{ to: { element: { type: 'shared' } } }],
            },
          ],
        },
      ],

      // warn だと `pnpm lint` が終了コード0で通過し、実質的に無効だった（2026-08-21 の剪定監査）。
      // プロンプト側5箇所の注意喚起に頼っていた状態を解消するため error に格上げする。
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
