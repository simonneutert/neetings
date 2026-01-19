import preact from 'eslint-config-preact';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/**', 'public/vendor/**']
  },
  ...preact,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        location: 'readonly'
      }
    },
    settings: {
      react: { version: 'detect' }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // Use TypeScript version
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }],
      'prefer-arrow-callback': 'off', // Allow both styles
      'react/prop-types': 'off', // Using TypeScript
      'react/react-in-jsx-scope': 'off' // Not needed in modern React/Preact
    }
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Test globals (Vitest/Jest)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly' // Vitest
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^(_|vi|fireEvent|waitFor|createMeetingWithBlocks|createTestMeeting)',
        varsIgnorePattern: '^(_|vi|fireEvent|waitFor|createMeetingWithBlocks|createTestMeeting)'
      }]
    }
  }
];
