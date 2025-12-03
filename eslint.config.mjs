import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 1. Kon file gulo lint korbe (Shudhu src folder er ts file)
  { files: ["src/**/*.ts"] },

  // 2. Kon folder gulo ignore korbe
  { ignores: ["dist", "node_modules", "coverage"] },

  // 3. Base Configurations
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // 4. Custom Rules & Environment
  {
    languageOptions: {
      globals: {
        ...globals.node, // Node.js globals jemon process, __dirname support korar jonno
      },
    },
    rules: {
      // Unused variable error bondho kora, jodi variable er namer age underscore (_) thake
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      
      // warning for console.log 
      "no-console": "warn",
      
      // 'any' type use 
      "@typescript-eslint/no-explicit-any": "off"
    },
  },

  // 5. Prettier config (Sobar last e thakte hobe)
  eslintConfigPrettier,
];