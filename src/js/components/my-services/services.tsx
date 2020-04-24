import React, { useEffect, useState } from 'react';
import Loader from '../commons/loader';
import Cards from './cards';
import Toolbar from './toolbar';
import { Service, Group } from 'js/model';
import { getServices, deleteService } from 'js/api/my-lab';

const Services = ({ groupId }) => {
	const [services, setServices] = useState<Service[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = (groupId?: String) => {
		setLoading(true);
		getServices(groupId).then((servicesResp) => {
			setServices(servicesResp.apps);
			setGroups(servicesResp.groups);
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
		loadData(groupId);
	}, [groupId]);

	return (
		<>
			<Toolbar
				hasService={services && services.length > 0}
				handleRefresh={() => loadData(groupId)}
				handleDeleteAll={deleteServices}
			/>
			{loading ? (
				<Loader em={18} />
			) : (
				<Cards services={services} groups={groups} />
			)}
		</>
	);
};

export default Services;
