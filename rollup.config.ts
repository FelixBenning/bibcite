import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';

const config = defineConfig({
	input: 'bibcite/index.ts',
	output: {
		file: 'dist/bibcite.js',
		format: 'cjs'
	},
	plugins: [typescript()]
});

export default config;
	