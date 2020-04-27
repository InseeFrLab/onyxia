import React, { useState, useEffect } from 'react';
import { CardMyService } from 'js/components/commons/service-card';
import { Service } from 'js/model';
import { getServices } from 'js/api/my-lab';
import { sleep } from 'js/utils';

const refresh = (id: String) => (status: String) => (
	onChange: (a: Service) => void
) => {
	if (status === 'DEPLOYING') {
		sleep(5000).then(() => {
			getServices().then((res) => {
				const s = res.apps.find((a) => id === a.id);
				if (s && s.status !== 'DEPLOYING') onChange(s);
				if (s) refresh(id)(s.status)(onChange);
			});
		});
	}
};

interface Props {
	service: Service;
}

const CardChecker = ({ service }: Props) => {
	const [checkedService, setCheckedService] = useState<Service>(service);
	const { id, status } = service;

	useEffect(() => {
		refresh(id)(status)(setCheckedService);
	}, [id, status]);

	return <CardMyService service={checkedService} />;
};

export default CardChecker;
