module.exports = {
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    allowImportExportEverywhere: true,
  },
  plugins: [
    'prefer-object-spread',
    '@typescript-eslint',
  ],
  env: {
    commonjs: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.ts', '.json'],
      },
    },
    'import/extensions': [
      '.ts',
    ],
  },
  rules: {
    /*
     * Typescript
     */
    'no-void': ['error', { allowAsStatement: true }],
    indent: 'off',
    '@typescript-eslint/indent': ['error', 2],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    'import/extensions': 'off',
    'import/no-cycle': ['error', { maxDepth: 1 }],
    '@typescript-eslint/restrict-template-expressions': ['error', {
      allowNullish: true,
    }],
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'comma',
        requireLast: true,
      },
      singleline: {
        delimiter: 'comma',
        requireLast: false,
      },
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
    }],
    /*
     * Airbnb
     */
    // Overrides
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['*.config.ts'],
    }],
    'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
    'func-names': 'error', // Changed from 'warn' to 'error'.
    'import/no-absolute-path': 'off', // Turned off because we use absolute paths instead of '../'.
    'implicit-arrow-linebreak': 'off', // Turned of because of bullshit
    'no-alert': 'error', // Changed from 'warn' to 'error'.
    'no-console': 'off', // Changed from 'warn' to 'error'.
    'no-constant-condition': 'error', // Changed from 'warn' to 'error'.
    'no-underscore-dangle': ['error', { // Make some exceptions for often used fields
      allow: [
        '_id',
        '_aggregated',
        '_details',
      ],
    }],
    semi: ['error', 'never'], // Changed from 'always' to 'never', because we never use semicolons.
    // Additions
    'no-warning-comments': 'warn',
    'import/order': ['error', {
      groups: [
        'internal',
        'builtin',
        'external',
        'parent',
        'sibling',
        'index',
      ],
      'newlines-between': 'never',
    }],
    /*
     * Extentions
     */
    'no-use-before-define': ['error', { functions: false }],
    'object-curly-newline': 'off',
    'max-len': [
      2,
      {
        code: 100,
        ignoreComments: true,
        ignoreUrls: true,
        ignoreTemplateLiterals: true,
        ignorePattern: "mf\\s*\\(\\s*(['\"])(.*?)\\1\\s*,\\s*.*?\\s*,?\\s*(['\"])(.*?)\\3,?.*?\\)",
      },
    ],
    'prefer-object-spread/prefer-object-spread': 'error',
    'object-shorthand': ['error', 'always'],
  },
}
