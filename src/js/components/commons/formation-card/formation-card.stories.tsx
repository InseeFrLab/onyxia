import React from 'react';
import FormationCard from './component';
import fakeFormation from 'js/model/sampledata/basic-formation.json';

export default {
	title: 'Formation card',
	component: FormationCard,
	includeStories: [],
};

const deployment = 'deploy';
const hasPart = [fakeFormation];

export const None = () => <FormationCard formation={fakeFormation} />;

None.story = {
	title: 'No links',
};

export const Formation = () => (
	<FormationCard formation={{ ...fakeFormation, hasPart }} />
);

Formation.story = {
	title: 'Formation link',
};

export const Deployment = () => (
	<FormationCard formation={{ ...fakeFormation, deployment }} />
);

Deployment.story = {
	title: 'Deployment link',
};

export const Both = () => (
	<FormationCard formation={{ ...fakeFormation, hasPart, deployment }} />
);

Both.story = {
	title: 'Both links',
};
