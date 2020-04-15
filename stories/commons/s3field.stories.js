import React from 'react';
import { object, boolean, text } from '@storybook/addon-knobs';
import S3Field from 'js/components/mon-compte/s3.js';

export default {
	title: 'S3Field',
	component: S3Field,
	includeStories: [],
};

export const BasicS3Field = () => (
	<S3Field
		versionsList={object('versionsList', {
			V1: 'toto',
			V2: 'tata',
			V3: 'titi',
		})}
	/>
);

BasicS3Field.story = {
	title: 'BasicS3Field',
};
