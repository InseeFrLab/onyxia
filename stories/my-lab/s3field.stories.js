import React from 'react';
import { object, boolean } from '@storybook/addon-knobs';
import S3Field from 'js/components/mon-compte/s3.js';

export default {
	title: 'S3Field',
	component: S3Field,
	includeStories: [],
};

export const BasicS3Field = () => <S3Field value="toto" />;

BasicS3Field.story = {
	title: 'BasicS3Field',
};
