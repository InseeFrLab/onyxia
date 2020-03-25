import React from 'react';
import { Avatar } from '@material-ui/core/';

export const getAvatar = (service) =>
	service &&
	service.resource &&
	service.resource.resource &&
	service.resource.resource.images ? (
		<Avatar src={service.resource.resource.images['icon-medium']} />
	) : (
		<Avatar>A</Avatar>
	);

export const formatUrl = (url) => {
	return url;
};
