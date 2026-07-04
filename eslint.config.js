// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    ignores: [
      "dist/*",
      ".agents/**",
      ".superpowers/**",
      "node_modules/**"
    ],
  },
  expoConfig,
  {
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    }
  }
]);
