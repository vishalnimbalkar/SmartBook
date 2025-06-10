import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{ ignores: ['node_modules/', 'package-lock.json', '.env', 'utilities/'] },
	{ files: ['**/*.{js,mjs,cjs}'], plugins: { js }, extends: ['js/recommended'] },
	{ files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
	{ files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.browser } },
	{
		rules: {
			'no-undef': 'off',
			'semi': 'warn',
			'no-unused-vars': 'warn',
			'quotes': ['warn', 'single', { allowTemplateLiterals: true }],
			'arrow-body-style': ['warn', 'always'],
			'eqeqeq': 'warn',
			'no-var': 'warn',
			'prefer-const': 'warn',
			'camelcase': [
				'warn',
				{ properties: 'always', ignoreDestructuring: false, ignoreImports: false, ignoreGlobals: false },
			],
		},
	},
]);
// add ignores files
