import React from 'react';
import { object, boolean, text } from '@storybook/addon-knobs';
import S3Field from 'js/components/mon-compte/s3.tsx';

export default {
	title: 'S3Field',
	component: S3Field,
	includeStories: [],
};

export const BasicS3Field = () => (
	<S3Field
		versionsList={object('versionsList', ['1', '2', '3'])}
		value={text('value', 'toto')}
		currentPwd={text('pwd', 'coucou ')}
	/>
);

BasicS3Field.story = {
	title: 'BasicS3Field',
};
