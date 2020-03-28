import React, { useEffect, useState } from 'react';
import Service from '../service.component';
import Deploiement from '../deploiement.component';
import { axiosPublic } from 'js/utils';
import api from 'js/redux/api';

const Leaf = ({ location, ...props }) => {
	const [idCatalogue, idService] = getId(location);
	const [service, setService] = useState(undefined);

	const [init, setInit] = useState(false);
	useEffect(() => {
		let unmount = false;

		const loadService = async () => {
			const service = await axiosPublic(
				`${api.catalogue}/${idCatalogue}/${idService}`
			);
			if (!unmount) {
				setService(service);
				setInit(true);
			}
		};
		if (!unmount && !init) {
			loadService();
		}
		return () => (unmount = true);
	}, [init, idCatalogue, idService]);

	return service ? (
		isDeploiement(location) ? (
			<Deploiement
				{...props}
				location={location}
				service={service}
				idCatalogue={idCatalogue}
				idService={idService}
			/>
		) : (
			<Service
				{...props}
				location={location}
				service={service}
				idCatalogue={idCatalogue}
				idService={idService}
			/>
		)
	) : null;
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
