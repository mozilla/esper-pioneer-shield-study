/* eslint-env node */

"use strict";

/* All Mozilla specific rules and enviroments at:
 * http://firefox-source-docs.mozilla.org/tools/lint/linters/eslint-plugin-mozilla.html
 */

module.exports = {
  env: {
    es6: true,
  },
  extends: [
    "eslint:recommended",
    /* list of rules at:
     * https://dxr.mozilla.org/mozilla-central/source/tools/lint/eslint/eslint-plugin-mozilla/lib/configs/recommended.js
     */
    "plugin:mozilla/recommended",
  ],
  parserOptions: {
    ecmaVersion: 8,
    sourceType: "module",
    ecmaFeatures: {
      jsx: false,
      experimentalObjectRestSpread: true,
    },
  },
  plugins: ["json", "mozilla"],
  root: true,
  rules: {
    "babel/new-cap": "off",
    "mozilla/balanced-listeners": "off",
    "mozilla/no-aArgs": "warn",
    "comma-dangle": ["error", "always-multiline"],
    eqeqeq: "error",
    indent: ["warn", 2, { SwitchCase: 1 }],
    "no-console": "warn",
    "no-shadow": ["error"],
    "no-unused-vars": "error",
    "prefer-const": "warn",
    "prefer-spread": "error",
    semi: ["error", "always"],
  },
};
