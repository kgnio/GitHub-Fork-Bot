// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-redeclare": "off",
      "no-dupe-keys": "off",
      "no-empty": "off",
      "no-useless-escape": "off",
      "no-func-assign": "off",
      "no-control-regex": "off",
      "no-fallthrough": "off",
      "no-with": "off",
      "no-constant-binary-expression": "off",
      "no-self-assign": "off",
    },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },
  {
    files: [
      "**/*.min.js",
      "**/vendor/**/*.js",
      "**/dist/**/*.js",
      "**/build/**/*.js",
      "**/node_modules/**/*.js",
      "**/third_party/**/*.js",
      "**/third-party/**/*.js",
      "**/libs/**/*.js",
      "**/lib/**/*.js",
      "**/externals/**/*.js",
      "**/external/**/*.js",
    ],
    rules: {
      all: "off",
    },
  },
]);
