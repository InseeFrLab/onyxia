import React, { useState, useEffect, useCallback } from 'react';
import Loader from '../commons/loader';
import ServiceDetails from './service-details';
import { getService, deleteService } from 'js/api/my-lab';
import { Service } from 'js/model';
import Toolbar from './toolbar';
import { Redirect } from 'react-router-dom';

interface Props {
	serviceId: string;
}

const MyService = ({ serviceId }: Props) => {
	const [loading, setLoading] = useState(false);
	const [service, setService] = useState<Service>(undefined);
	const [redirect, setRedirect] = useState<string>(undefined);

	const refreshData = useCallback(() => {
		setLoading(true);
		getService(serviceId).then((service) => {
			setService(service);
			setLoading(false);
		});
	}, [serviceId]);

	const handleDelete = () => {
		setLoading(true);
		deleteService(service).then(() => {
			setLoading(false);
			setRedirect('/my-services');
		});
	};

	useEffect(() => {
		if (!service) {
			refreshData();
		}
	}, [service, serviceId, refreshData]);

	if (redirect) return <Redirect to={redirect} />;

	return (
		<div className="contenu accueil">
			<Toolbar
				handleRefresh={() => refreshData()}
				handleDelete={() => handleDelete()}
			/>
			{loading ? <Loader em={18} /> : <ServiceDetails service={service} />}
		</div>
	);
};

export default MyService;
