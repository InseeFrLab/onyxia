import React from 'react';
import { Service } from 'js/model';

interface Props {
	service: Service;
}

const ServiceTasks = ({ service }: Props) => (
	<>
		{service.tasks ? service.tasks.map((task) => <div>{task.id}</div>) : <></>}
	</>
);

export default ServiceTasks;
