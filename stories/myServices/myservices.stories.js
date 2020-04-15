import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { object, boolean } from '@storybook/addon-knobs';
import ListeCartes from 'js/components/commons/service-liste/liste-cartes';
import fakeServices from './services.json';

export default {
	title: 'My services',
	component: ListeCartes,
	includeStories: [],
};

export const NoServices = () => (
	<MemoryRouter>
		<ListeCartes services={[]} groupes={[]} />
	</MemoryRouter>
);

NoServices.story = {
	title: 'No services',
};

export const SingleService = () => (
	<MemoryRouter>
		<ListeCartes services={fakeServices} groupes={[]} />
	</MemoryRouter>
);

SingleService.story = {
	title: 'Single service',
};
