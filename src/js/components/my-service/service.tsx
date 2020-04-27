import React, { useState } from 'react';
import Loader from '../commons/loader';
import ServiceDetails from './service-details';

interface Props {
	serviceId: string;
}

const MyService = ({ serviceId }: Props) => {
	const [loading] = useState(false);
	return (
		<div className="contenu accueil">
			{loading ? <Loader em={18} /> : <ServiceDetails service={undefined} />}
		</div>
	);
};

export default MyService;
