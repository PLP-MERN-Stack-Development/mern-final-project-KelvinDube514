const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_' 
      }],
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': 'warn',
      'curly': 'warn',
      'no-trailing-spaces': 'warn',
      'indent': ['warn', 2],
      'quotes': ['warn', 'single', { 'allowTemplateLiterals': true }],
      'semi': ['warn', 'always']
    }
  },
  {
    // Test files configuration
    files: ['**/*.test.js', '**/tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    }
  }
];
