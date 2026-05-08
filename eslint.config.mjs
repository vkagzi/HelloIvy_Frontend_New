import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});
const parser = await import('@typescript-eslint/parser');
const prettierPlugin = await import('eslint-plugin-prettier');

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['node_modules', 'build', 'dist', '.next'],
  },
  // Add a flat config object with parser, plugins, and rules
  {
    files: ['**/*.ts', '**/*.tsx'], // Apply only to TypeScript files
    //ignore node_modules and build directories
    languageOptions: {
      parser: parser.default,
    },
    plugins: {
      prettier: prettierPlugin.default,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'prettier/prettier': 'warn',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
  prettierConfig,
];

export default eslintConfig;
