import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import nodePolyfills from "rollup-plugin-polyfill-node";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";

const default_plugins = [
  nodeResolve({ browser: true }),
  commonjs({
    include: "node_modules/**",
  }),
  typescript(),
  nodePolyfills(),
  json(),
];

const config = defineConfig({
  input: "bibcite/index.ts",
  output: [
    {
      file: "dist/bibcite.js",
      format: "cjs",
    },
    {
      file: "dist/bibcite.min.js",
      format: "cjs",
      plugins: [
        terser({format: {comments: false}})
      ],
    },
  ],
  plugins: default_plugins,
});

export default config;
