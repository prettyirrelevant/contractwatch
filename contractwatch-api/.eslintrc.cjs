module.exports = {
    extends: [
      'eslint:recommended',
      'plugin:prettier/recommended',
      'plugin:@typescript-eslint/strict',
      'plugin:@typescript-eslint/stylistic',
      'plugin:perfectionist/recommended-line-length',
    ],
    plugins: ['@typescript-eslint', 'perfectionist'],
    parserOptions: {
      project: true,
    },
    parser: '@typescript-eslint/parser',
  };
