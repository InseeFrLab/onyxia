import React, { useEffect, useState } from 'react';
import { axiosAuthTyped } from 'js/utils';
import apiPaths from 'js/configuration/api-paths';
import Loader from '../commons/loader';
import Cards from './cards';
import Toolbar from './toolbar';

const Services = () => {
	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);

	const loadData = () => {
		setLoading(true);
		axiosAuthTyped.get<{ apps: [] }>(apiPaths.myServices).then((resp) => {
			setServices(resp.data.apps);
			setLoading(false);
		});
	};

	useEffect(() => {
		loadData();
	}, []);

	return (
		<>
			<Toolbar
				hasService={services && services.length > 0}
				handleRefresh={loadData}
				handleDeleteAll={() => console.log('Stub delete')}
				handlePauseAll={() => console.log('Stub pause all')}
			/>
			{loading ? <Loader em={18} /> : <Cards services={services} />}
		</>
	);
};

export default Services;
