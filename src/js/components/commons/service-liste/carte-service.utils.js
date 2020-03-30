import React from 'react';
import { Avatar } from '@material-ui/core';

export const getServiceAvatar = (service) => (
	<span className={`etat-service ${getColorClassStateService(service)}`}>
		<span className="bordure-carte">
			<Avatar src={service.logo} className="service-avatar" />
		</span>
	</span>
);

export const getTitle = (service) => service.title || '';

export const getSubtitle = (service) => service.subtitle || '';

export const getColorClassStateService = (service) => 'running';
