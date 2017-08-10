module.exports = {
  extends: require.resolve('@rispa/eslint-config'),
  rules: {
    'no-console': 'off',
    'global-require': 'off',
    'import/no-dynamic-require': 'off',
    'comma-dangle': ['error', {
        'arrays': 'ignore',
        'objects': 'ignore',
        'imports': 'ignore',
        'exports': 'ignore',
        'functions': 'never',
    }],
  },
}
