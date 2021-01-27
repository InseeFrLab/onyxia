var fs = require('fs');

fs.readFile('.env', 'utf8', function (err, contents) {
	const content = contents
		.split('\n')
		.filter((line) => !line.startsWith('#'))
		.map((line) => line.split('='))
		.filter((data) => data.length === 2)
		.map(
			([key]) =>
				`echo "window._env_['${key.replace(
					'REACT_APP_',
					''
				)}'] = \\"$${key.replace(
					'REACT_APP_',
					''
				)}\\";" >> /usr/share/nginx/html/env-config.js`
		);

	const fullFile = ['#!/bin/sh', ...content, 'exec "$@"'].join('\n');
	fs.writeFileSync('entrypoint.sh', fullFile, 'utf8');
});
