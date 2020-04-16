import React from 'react';
import ListeCartes from 'js/components/commons/service-liste/liste-cartes';
import basicService from 'js/model/sampledata/basic-service.json';

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
	<ListeCartes services={[basicService]} groupes={[]} />
);

SingleService.story = {
	title: 'Single service',
};
