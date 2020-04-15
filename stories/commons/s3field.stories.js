import React from 'react';
import { object, boolean, text } from '@storybook/addon-knobs';
import S3Field from 'js/components/mon-compte/s3.js';

export default {
	title: 'S3Field',
	component: S3Field,
	includeStories: [],
};

export const BasicS3Field = () => <S3Field value={text('value', 'toto')} />;

export const RenewableS3Field = () => <S3Field value={text('value', 'toto')} />;

export const ListS3Field = () => <S3Field value={text('value', 'toto')} />;

BasicS3Field.story = {
	title: 'BasicS3Field',
};

RenewableS3Field.story = {
	title: 'RenewableS3Field',
};

ListS3Field.story = {
	title: 'ListS3Field',
};
