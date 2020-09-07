import React from 'react';
import { Avatar } from '@material-ui/core';
import { Service } from 'js/model';

export const getServiceAvatar = (service: Service) => {
	const img = service.logo;
	return (
		<span className={`etat-service ${getColorClassStateService()}`}>
			<span className="bordure-carte">
				<Avatar src={img} className="service-avatar" />
			</span>
		</span>
	);
};

export const getTitle = (service: Service) => (service && service.name) || '';

export const getSubtitle = (service: Service) =>
	service.subtitle ||
	(service && service.labels && service.labels.ONYXIA_SUBTITLE) ||
	'';

const getColorClassStateService = () => 'running';
