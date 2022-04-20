import config from './rollup.config';
import { terser } from "rollup-plugin-terser";

config.plugins.push(
  terser({format: {comments: false}})
)
config.output = {
  file: "dist/bibcite.min.js",
  format: "cjs",
};

export default config;