// ESLint flat config — extends Expo's recommended rules, with Prettier last
// so formatting rules never conflict with the formatter itself.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'scripts/.cache/*'],
  },
]);
