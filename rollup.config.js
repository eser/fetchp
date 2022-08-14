import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";
import pkg from "./package.json";

const externals = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

export default [
  {
    input: "src/index.ts",
    plugins: [esbuild()],
    external: externals,
    output: [
      {
        file: pkg.main, // dist/index.js
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
    ],
  },
  {
    input: "src/index.ts",
    plugins: [esbuild()],
    external: externals,
    output: [
      {
        file: pkg.module, // dist/mod.js
        format: "esm",
        sourcemap: true,
        exports: "named",
      },
    ],
  },
  {
    input: "src/index.ts",
    plugins: [dts()],
    external: externals,
    output: {
      file: pkg.types, // dist/index.d.ts
      format: "es",
    },
  },
];
