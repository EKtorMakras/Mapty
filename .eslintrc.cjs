require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:json/recommended-with-comments",
    // "plugin:@typescript-eslint/recommended"
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["html"],
  globals: {
    process: "readonly",
    require: "readonly",
    module: "readonly",
  },

  rules: {
    // =========== General =========== //
    indent: ["warn", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    quotes: ["warn", "double"],
    semi: ["warn", "always"],

    "no-empty": "warn",
    "no-cond-assign": ["warn", "always"],
    "no-multiple-empty-lines": [
      "warn",
      {
        max: 2,
        maxEOF: 0,
        maxBOF: 0,
      },
    ],

    // Disable
    "init-declarations": "off",
    "no-console": "off",
    "no-inline-comments": "off",
    "no-unused-expressions": "off",
    "no-unused-vars": "off",
    "no-new": "off",
    curly: "off",
    camelcase: "off",
  },
};
