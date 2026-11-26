import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const webglPaths = [
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
];

const webglPatterns = {
  group: ["three/*", "@react-three/fiber/*", "@react-three/drei/*"],
  message:
    "Keep WebGL imports inside src/experience and load them with a client-only dynamic import.",
};

const experienceEntryPattern = {
  group: ["@/experience", "@/experience/*", "**/experience/*"],
  message:
    "Only components/workstation/experience-loader.tsx may import src/experience, through a dynamic import().",
};

// no-restricted-imports does not look at dynamic import(), so cover it here.
// esquery regex literals cannot contain "/", so "." stands in for it.
const dynamicWebglImport = {
  selector: "ImportExpression[source.value=/^(three|@react-three)/]",
  message:
    "Import three.js, React Three Fiber and Drei only from src/experience.",
};
const dynamicExperienceImport = {
  selector: "ImportExpression[source.value=/^@.experience/]",
  message:
    "Only components/workstation/experience-loader.tsx may import src/experience.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Everything outside src/experience: no WebGL packages, no direct
    // imports of the experience module.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/experience/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: webglPaths,
          patterns: [webglPatterns, experienceEntryPattern],
        },
      ],
      "no-restricted-syntax": [
        "error",
        dynamicWebglImport,
        dynamicExperienceImport,
      ],
    },
  },
  {
    // The loader is the single bridge into src/experience.
    files: ["src/components/workstation/experience-loader.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: webglPaths,
          patterns: [webglPatterns],
        },
      ],
      "no-restricted-syntax": ["error", dynamicWebglImport],
    },
  },
]);

export default eslintConfig;
