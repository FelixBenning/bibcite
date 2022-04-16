import config from './rollup.config';
import serve from 'rollup-plugin-serve';

config.plugins.push(
	serve({
		open: true,
		contentBase: ['dist', 'examples'],
		openPage: "/index.html",
		headers: {
			"Access-Control-Allow-Origin": "*"
		},
		port: 8088
	})
)

export default config;