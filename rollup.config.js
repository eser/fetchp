import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import flatDts from "rollup-plugin-flat-dts";
import { minify } from "rollup-plugin-esbuild";
import renameFiles from "rollup-plugin-rename-files";
import multiInput from "rollup-plugin-multi-input";
import sourcemaps from "rollup-plugin-sourcemaps";
import pkg from "./package.json";

const externals = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const globalPlugins = [
  commonjs(),
  nodeResolve(),
  multiInput({
    relative: "dist/tsc/",
  }),
  sourcemaps(),
  minify(),
];

function template(formats, configFn) {
  return formats.reduce(
    (acc, curr) => {
      return [...acc, ...configFn(curr)];
    },
    [],
  );
}

const bundles = [
  { format: "cjs", entry: "index" },
  { format: "esm", entry: "mod" },
];

const config = template(bundles, (bundle) => [
  {
    input: [
      {
        [bundle.entry]: "dist/tsc/index.js",
        [`${bundle.entry}.mock`]: "dist/tsc/index.mock.js",
      },
      "!dist/tsc/**/*.test.js",
    ],
    // preserveModules: true,
    plugins: [
      ...globalPlugins,
      // esbuild(),
      flatDts({
        lib: true,
        file: `${bundle.entry}.d.ts`,
        entries: {
          "index": {},
          "index.mock": {
            as: "mock",
            file: `${bundle.entry}.mock.d.ts`,
          },
        },
      }),
      renameFiles({
        includes: "index.",
        moduleName: (name) => {
          if (bundle.entry === "index") {
            return name;
          }

          return name.replace("index.", `${bundle.entry}.`);
        },
      }),
    ],
    external: externals,
    output: [
      {
        dir: `dist/${bundle.format}/`,
        format: bundle.format,
        sourcemap: true,
        chunkFileNames: "[name].js",
        exports: "named",
      },
    ],
  },
]);

export default config;
