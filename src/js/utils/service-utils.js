import React from 'react';
import { Avatar } from '@material-ui/core/';

export const getAvatar = (service) =>
	service && service.resource && service.resource.images ? (
		<Avatar src={service.resource.images['icon-small']} />
	) : (
		<Avatar>A</Avatar>
	);

export const formatUrl = (url) => {
	return url;
};
