import React, { useEffect, useState } from 'react';
import Loader from '../commons/loader';
import Cards from './cards';
import Toolbar from './toolbar';
import { Service } from 'js/model';
import { getServices, deleteService } from 'js/api/my-lab';

const Services = () => {
	const [services, setServices] = useState<Service[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = () => {
		setLoading(true);
		getServices().then((servicesResp) => {
			setServices(servicesResp);
			setLoading(false);
		});
	};

	const deleteServices = () => {
		setLoading(true);
		Promise.all(services.map((service) => deleteService(service))).then(() => {
			setLoading(false);
			loadData();
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
				handleDeleteAll={deleteServices}
				handlePauseAll={() => console.log('Stub pause all')}
			/>
			{loading ? <Loader em={18} /> : <Cards services={services} />}
		</>
	);
};

export default Services;
