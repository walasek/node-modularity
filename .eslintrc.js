module.exports = {
	extends: ['plugin:prettier/recommended', 'plugin:security/recommended'],
	parserOptions: {
		ecmaVersion: 2019,
	},
	env: {
		node: true,
	},
	plugins: ['node', 'promise', 'security'],
	rules: {
		'array-element-newline': ['error', 'consistent'],
		'arrow-parens': ['error', 'as-needed'],
		'block-spacing': ['error', 'always'],
		camelcase: 'error',
		'comma-dangle': ['error', 'only-multiline'],
		'comma-style': ['error', 'last'],
		curly: ['error', 'all'],
		'default-case': 'error',
		'guard-for-in': 'warn',
		indent: ['warn', 'tab', { SwitchCase: 1 }], // Prettier ignores this
		'keyword-spacing': ['error', { before: true, after: true }],
		'linebreak-style': ['error', 'unix'], // Prettier ignores this
		'max-len': ['warn', { code: 120 }],
		'multiline-ternary': 'off', // Prettier ignores this?
		'newline-after-var': 'error',
		'no-console': 'error',
		'no-empty': ['error', { allowEmptyCatch: true }],
		'no-extra-parens': 'off',
		'no-loop-func': 'error',
		'no-multiple-empty-lines': ['error', { max: 1 }],
		'no-nested-ternary': 'error',
		'no-param-reassign': 'error',
		'no-process-env': 'error',
		'no-prototype-builtins': 'error',
		'no-throw-literal': 'error',
		'no-trailing-spaces': 'error',
		'no-underscore-dangle': ['error', { allow: ['_module'] }],
		'no-unexpected-multiline': 'error',
		'no-unreachable': 'error',
		'no-unused-expressions': 'error',
		'no-unused-vars': ['error', { ignoreRestSiblings: true }],
		'no-useless-constructor': 'error',
		'object-curly-spacing': ['error', 'always'],
		'object-shorthand': 'error',
		'operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
		'prefer-arrow-callback': 'error',
		'prefer-const': 'error',
		'prefer-destructuring': ['warn', { object: true, array: true }, { enforceForRenamedProperties: false }],
		'prefer-spread': 'error',
		'prettier/prettier': 'error',
		radix: ['error', 'as-needed'],
		semi: ['error', 'always'],
		'semi-style': ['error', 'last'],
		'spaced-comment': ['error', 'always'],
	},
	root: true,
};
