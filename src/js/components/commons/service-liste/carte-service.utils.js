import React from 'react';
import { Avatar } from '@material-ui/core';

export const getServiceAvatar = (service) => (
	<span className={`etat-service ${getColorClassStateService(service)}`}>
		<span className="bordure-carte">
			<Avatar src={service.labels.ONYXIA_LOGO} className="service-avatar" />
		</span>
	</span>
);

export const getTitle = (service) =>
	(service && service.title) ||
	(service && service.labels && service.labels.ONYXIA_NAME) ||
	'';

export const getSubtitle = (service) =>
	service.subtitle ||
	(service && service.labels && service.labels.ONYXIA_SUBTITLE) ||
	'';

export const getColorClassStateService = (service) => 'running';
