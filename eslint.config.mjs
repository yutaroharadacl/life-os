import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-plugin-prettier/recommended';
import importX from 'eslint-plugin-import-x';
import boundaries from 'eslint-plugin-boundaries';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  {
    plugins: {
      'import-x': importX,
      boundaries,
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

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],

      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],

      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'app',
              allow: ['feature', 'shared'],
            },
            {
              from: 'feature',
              allow: ['shared'],
            },
            {
              from: 'shared',
              allow: ['shared'],
            },
          ],
        },
      ],

      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
