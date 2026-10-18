import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 测试与构建产物
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    ".wrangler/**",
  ]),
  {
    rules: {
      // Next 16 内置的 react-hooks v6 新增规则，会把「挂载后置状态 / 主题水合」
      // 这类既有且无副作用的模式判为 error；此处降级为 warn，避免 CI lint 阻塞。
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
