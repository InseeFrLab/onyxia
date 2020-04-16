import React from 'react';
import { Avatar } from '@material-ui/core';
import { Service } from 'js/model';

export const getServiceAvatar = (service: Service) => {
	const img = service.logo || service.labels.ONYXIA_LOGO;
	return (
		<span className={`etat-service ${getColorClassStateService(service)}`}>
			<span className="bordure-carte">
				<Avatar src={img} className="service-avatar" />
			</span>
		</span>
	);
};

export const getTitle = (service: Service) =>
	(service && service.name) ||
	(service && service.labels && service.labels.ONYXIA_NAME) ||
	'';

export const getSubtitle = (service: Service) =>
	service.subtitle ||
	(service && service.labels && service.labels.ONYXIA_SUBTITLE) ||
	'';

export const getColorClassStateService = (service: Service) => 'running';
