// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
module.exports = {
  mutate: ['src/services/**/*.ts', '!src/**/*.test.ts'],
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],

  vitest: {
    configFile: 'vitest.config.ts',
  },

  reporters: ['clear-text', 'progress', 'html'],
  coverageAnalysis: 'off',
};
