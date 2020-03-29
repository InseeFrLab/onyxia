import React from 'react';
import Service from './service';
import Deploiement from './deploiement';

const Leaf = ({ location }) => {
	const [idCatalogue, idService] = getId(location);
	return isDeploiement(location) ? (
		<Deploiement idCatalogue={idCatalogue} idService={idService} />
	) : (
		<Service idCatalogue={idCatalogue} idService={idService} />
	);
};

export default Leaf;

/* */
const isDeploiement = (pathname = '/') => {
	return (
		pathname
			.split('/')
			.reduce((a, x) => (x.trim().length > 0 ? x : a), undefined) ===
		'deploiement'
	);
};

const getId = (location) =>
	location
		.replace('/my-lab/catalogue', '')
		.split('/')
		.filter((t) => t.trim().length > 0);
