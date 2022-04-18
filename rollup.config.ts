import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import nodePolyfills from "rollup-plugin-polyfill-node";
import json from "@rollup/plugin-json";

const config = defineConfig({
  input: "bibcite/index.ts",
  output: {
    file: "dist/bibcite.js",
    format: "umd",
  },
  plugins: [
    nodeResolve({browser: true}),
    commonjs({
      include: "node_modules/**",
      // dynamicRequireTargets: ["node_modules/citation-js"],
    }),
    typescript(),
    nodePolyfills(),
    json(),
  ],
});

export default config;
