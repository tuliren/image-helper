const { resolve } = require('node:path');
const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import-x');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const onlyWarn = require('eslint-plugin-only-warn');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    plugins: {
      'import-x': importPlugin,
    },
    rules: {
      'import-x/no-unresolved': 'error',
      'import-x/named': 'error',
      'import-x/namespace': 'error',
      'import-x/default': 'error',
      'import-x/export': 'error',
      'import-x/no-named-as-default': 'warn',
      'import-x/no-named-as-default-member': 'warn',
      'import-x/no-deprecated': 'warn',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/tests/**/*.ts',
            '**/tests/**/*.tsx',
            '**/__tests__/**/*.ts',
            '**/__tests__/**/*.tsx',
            '**/webpack/**/*.js',
            '**/scripts/**/*.ts',
          ],
          optionalDependencies: false,
          peerDependencies: true,
        },
      ],
      'import-x/no-mutable-exports': 'warn',
      'import-x/no-cycle': 'error',
      'no-unused-vars': 'off',
      'no-empty-pattern': 'off',
      curly: 'error',
      'eol-last': ['error', 'always'],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import-x/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
          project,
        },
      },
    },
    rules: {
      'import-x/named': 'off',
      'import-x/namespace': 'off',
      'import-x/default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'only-warn': onlyWarn,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.node,
        ...globals.jest,
        React: true,
        JSX: true,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    ignores: [
      '**/.*.js',
      '**/node_modules/',
      '**/dist/',
      '**/coverage/',
      'webpack/**',
      'eslint.config.js',
      'postcss.config.cjs',
      '.prettierrc.js',
    ],
  },
];
