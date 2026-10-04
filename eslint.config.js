import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import globals from "globals";
import noImplicitPx from "./eslint-rules/no-implicit-px.js";

// Formerly provided by eslint-config-preact, which does not support ESLint 10.
// React/JSX rules are mapped to their @eslint-react equivalents; rules already
// covered by TypeScript (jsx-no-undef, jsx-no-duplicate-props, jsx-uses-vars)
// or only relevant to class components are omitted.
const preact = [
	js.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.es2015,
				...globals.node,
				expect: true,
				browser: true,
				global: true,
			},
		},
		plugins: {
			"@eslint-react": eslintReact,
		},
		rules: {
			/**
			 * Preact / JSX rules
			 */
			"@eslint-react/no-component-will-mount": "error",
			"@eslint-react/no-component-will-receive-props": "error",
			"@eslint-react/no-component-will-update": "error",
			"@eslint-react/no-missing-component-display-name": "warn",
			"@eslint-react/jsx-no-comment-textnodes": "error",
			"@eslint-react/dom-no-unsafe-target-blank": "error",
			"@eslint-react/no-missing-key": "error",
			"@eslint-react/no-duplicate-key": "error",
			"@eslint-react/dom-no-dangerously-set-innerhtml": "warn",
			"@eslint-react/no-set-state-in-component-did-mount": "error",
			"@eslint-react/no-set-state-in-component-did-update": "error",
			"@eslint-react/dom-no-find-dom-node": "error",

			/**
			 * Hooks
			 */
			"@eslint-react/rules-of-hooks": "error",
			"@eslint-react/exhaustive-deps": "warn",

			/**
			 * General JavaScript error avoidance
			 */
			"constructor-super": "error",
			"no-caller": "error",
			"no-const-assign": "error",
			"no-delete-var": "error",
			"no-dupe-class-members": "error",
			"no-dupe-keys": "error",
			"no-duplicate-imports": "error",
			"no-else-return": "warn",
			"no-empty-pattern": "off",
			"no-empty": "off",
			"no-iterator": "error",
			"no-lonely-if": "error",
			"no-multi-str": "warn",
			"no-new-wrappers": "error",
			"no-proto": "error",
			"no-redeclare": "error",
			"no-shadow-restricted-names": "error",
			"no-this-before-super": "error",
			"no-undef-init": "error",
			"no-unneeded-ternary": "error",
			"no-useless-call": "warn",
			"no-useless-computed-key": "warn",
			"no-useless-concat": "warn",
			"no-useless-constructor": "warn",
			"no-useless-escape": "warn",
			"no-useless-rename": "warn",
			"no-var": "warn",
			"no-with": "error",
			strict: ["error", "never"],
			"object-shorthand": "warn",
			"prefer-rest-params": "warn",
			"prefer-spread": "warn",
			"prefer-template": "warn",
			radix: "warn",
			"unicode-bom": "error",
			// New in ESLint 10's recommended set; Error `cause` needs lib ES2022 (tsconfig targets ES2020)
			"preserve-caught-error": "off",
		},
	},
];

export default [
	{
		ignores: ["dist/**", "public/vendor/**"],
	},
	...preact,
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: { jsx: true },
			},
			globals: {
				// Browser globals
				window: "readonly",
				document: "readonly",
				console: "readonly",
				navigator: "readonly",
				location: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": typescriptEslint,
		},
		rules: {
			"no-undef": "off", // TypeScript handles this
			"no-unused-vars": "off", // Use TypeScript version
			"@typescript-eslint/no-unused-vars": ["error", {
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				destructuredArrayIgnorePattern: "^_",
			}],
			"prefer-arrow-callback": "off", // Allow both styles
		},
	},
	{
		// Type-aware so numbers from ternaries, variables or arithmetic are caught
		files: ["src/**/*.{jsx,tsx}"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			local: { rules: { "no-implicit-px": noImplicitPx } },
		},
		rules: {
			"local/no-implicit-px": "error",
		},
	},
	{
		files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
		languageOptions: {
			globals: {
				// Test globals (Vitest/Jest)
				describe: "readonly",
				it: "readonly",
				test: "readonly",
				expect: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				beforeAll: "readonly",
				afterAll: "readonly",
				vi: "readonly", // Vitest
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": ["error", {
				argsIgnorePattern:
					"^(_|vi|fireEvent|waitFor|createMeetingWithBlocks|createTestMeeting)",
				varsIgnorePattern:
					"^(_|vi|fireEvent|waitFor|createMeetingWithBlocks|createTestMeeting)",
			}],
		},
	},
];
