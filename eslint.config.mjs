import eslint from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import nodePlugin from "eslint-plugin-n";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["coverage/", "dist/"] },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  nodePlugin.configs["flat/recommended"],
  {
    languageOptions: {
      parserOptions: { projectService: true },
      // without them, `n/no-unsupported-features/node-builtins` checks only imports, not globals
      globals: /** @type {import("eslint").Linter.Globals} */ (nodePlugin.configs["flat/recommended-module"].languageOptions?.globals)
    },
    rules: {
      // `lint:types` already proves that every import resolves
      "n/no-missing-import": "off",
      "n/prefer-node-protocol": "error",
      // warn when using APIs marked @deprecated in their JSDoc
      "@typescript-eslint/no-deprecated": "warn"
    }
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      // `engines.node` is the floor consumers run on; built-ins added after it must not be used
      "n/no-unsupported-features/node-builtins": "error"
    }
  },
  {
    // the code is what runs in the browser, see `renderSvg`
    files: ["src/helpers.ts"],
    rules: { "n/no-unsupported-features/node-builtins": ["error", { ignores: ["btoa"] }] }
  },
  {
    files: ["src/tests/**/*.ts"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/expect-expect": ["error", { assertFunctionNames: ["expect", "expectType"] }],
      // tests import devDependencies such as `puppeteer` and `vitest`
      "n/no-unpublished-import": "off"
    }
  },
  {
    files: ["*.mjs", "*.mts"],
    rules: { "n/no-unpublished-import": "off" }
  },
  prettier
);
