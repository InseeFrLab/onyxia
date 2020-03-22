import React from 'react';
import { Avatar } from '@material-ui/core';

export const getServiceAvatar = service => (
	<span className={`etat-service ${getColorClassStateService(service)}`}>
		<span className="bordure-carte">
			<Avatar src={service.labels.ONYXIA_LOGO} className="service-avatar" />
		</span>
	</span>
);

export const getTitle = service =>
	service.labels
		? service.labels.ONYXIA_TITLE
		: service.apps.length === 0
		? 'Supprime moi'
		: service.apps[0].labels.ONYXIA_TITLE;

export const getSubtitle = service =>
	service.labels
		? service.labels.ONYXIA_SUBTITLE
		: service.apps.length === 0
		? service.id
		: service.apps[0].labels.ONYXIA_TITLE;

export const getColorClassStateService = ({
	tasksStaged,
	tasksRunning,
	tasksHealthy,
	tasksUnhealthy,
}) => {
	if (tasksStaged !== 0) {
		return 'warn';
	} else if (tasksRunning > 0 && tasksHealthy > 0) {
		return 'running';
	} else if (tasksRunning > 0 && tasksHealthy === 0) {
		return 'pause';
	}
	return 'down';
};
