module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'plugin:node/recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'import/prefer-default-export': 'off',
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    'no-use-before-define': 'off',
    'no-param-reassign': 'off',
    'max-classes-per-file': 'off',
    camelcase: 'off',
    'max-len': 'off',
  },
};
