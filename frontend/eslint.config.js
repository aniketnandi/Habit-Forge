import globals from "globals";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";

export default [
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025,
      },
    },
    plugins: {
      prettier: prettier,
      react: reactPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      indent: ["error", 2, { SwitchCase: 1 }],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-console": 0,
      "prettier/prettier": [
        "error",
        {
          endOfLine: "lf",
          trailingComma: "es5",
          singleQuote: false,
        },
      ],
    },
  },
  eslintConfigPrettier,
];
