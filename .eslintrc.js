module.exports = {
  extends: require.resolve('@rispa/eslint-config'),
  rules: {
    'complexity': ['error', 10],
    'no-console': 'off',
    'global-require': 'off',
    'import/no-dynamic-require': 'off',
    'class-methods-use-this': 'off',
    'comma-dangle': ['error', {
        'arrays': 'ignore',
        'objects': 'ignore',
        'imports': 'ignore',
        'exports': 'ignore',
        'functions': 'never',
    }],
  },
}
