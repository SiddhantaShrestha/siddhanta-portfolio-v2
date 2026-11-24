import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/experience/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "three",
              message:
                "Import three.js only from src/experience so the UI bundle stays free of WebGL.",
            },
            {
              name: "@react-three/fiber",
              message:
                "Import React Three Fiber only from src/experience, then load that module on the client.",
            },
            {
              name: "@react-three/drei",
              message:
                "Import Drei only from src/experience, then load that module on the client.",
            },
          ],
          patterns: [
            {
              group: ["three/*", "@react-three/fiber/*", "@react-three/drei/*"],
              message:
                "Keep WebGL imports inside src/experience and load them with a client-only dynamic import.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
