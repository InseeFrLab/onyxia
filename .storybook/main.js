module.exports = {
	stories: ['../src/**/*.stories.(js|jsx|ts|tsx|mdx)'],
	addons: [
		'@storybook/preset-create-react-app',
		'@storybook/addon-actions',
		'@storybook/addon-links',
		'@storybook/addon-knobs',
		{
			name: '@storybook/addon-docs',
			options: {
				configureJSX: true,
			},
		},
	],
};
