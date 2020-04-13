const path = require('path');

module.exports = {
	stories: ['../stories/**/*.stories.(js|mdx)'],
	addons: [
		'@storybook/addon-actions',
		'@storybook/addon-links',
		'@storybook/addon-knobs',
		'@storybook/addon-docs',
	],
};
