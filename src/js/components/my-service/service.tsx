import React, { useState, useEffect } from 'react';
import Loader from '../commons/loader';
import ServiceDetails from './service-details';
import { getService } from 'js/api/my-lab';
import { Service } from 'js/model';

interface Props {
	serviceId: string;
}

const MyService = ({ serviceId }: Props) => {
	const [loading] = useState(false);
	const [service, setService] = useState<Service>(undefined);

	useEffect(() => {
		if (!service) {
			getService(serviceId).then((service) => setService(service));
		}
	}, [service, serviceId]);

	return (
		<div className="contenu accueil">
			{loading ? <Loader em={18} /> : <ServiceDetails service={service} />}
		</div>
	);
};

export default MyService;
