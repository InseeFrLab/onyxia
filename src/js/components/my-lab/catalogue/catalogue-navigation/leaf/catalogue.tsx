import React from "react";
import { NouveauService } from './deploiement/nouveau-service';
import { Service } from './service.component';

export const Leaf: React.FC<{ location: string; }> = ({ location }) => {
	const [idCatalogue, idService] = getId(location);
	return isDeploiement(location) ? (
		<NouveauService idCatalogue={idCatalogue} idService={idService} />
	) : (
		<Service idCatalogue={idCatalogue} idService={idService} />
	);
};

const isDeploiement = (pathname = '/') => {
	return (
		pathname
			.split('/')
			.reduce((a, x) => (x.trim().length > 0 ? x : a), "") ===
		'deploiement'
	);
};

const getId = (location: string) =>
	location
		.replace('/my-lab/catalogue', '')
		.split('/')
		.filter((t) => t.trim().length > 0);
