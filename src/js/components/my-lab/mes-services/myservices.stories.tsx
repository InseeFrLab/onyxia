import React from 'react';
import ListeCartes from 'js/components/commons/service-liste/liste-cartes';
import fakeServices from 'js/model/sampledata/basic-oneservice.json';

export default {
	title: 'My services',
	component: ListeCartes,
	includeStories: [],
};

export const NoServices = () => <ListeCartes services={[]} groupes={[]} />;

NoServices.story = {
	title: 'No services',
};

export const SingleService = () => (
	<ListeCartes services={fakeServices} groupes={[]} />
);

SingleService.story = {
	title: 'Single service',
};
