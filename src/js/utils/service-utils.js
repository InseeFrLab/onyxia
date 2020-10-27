import React from 'react';
import { Avatar } from '@material-ui/core/';

export const getAvatar = (service) =>
	service && service.resource && service.resource.images ? (
		<Avatar src={service.resource.images['icon-small']} />
	) : (
			service && service.icon ?
				<Avatar src={service.icon} /> :
				<Avatar>?</Avatar>
		);

export const formatUrl = (url) => {
	return url;
};

export const extractServiceId = (serviceId) => {
	try {
		return serviceId
			.split('/')
			.filter((a) => a && a.length > 0)
			.filter((a, i) => i > 1)
			.reduce((a, m) => (a ? `${a}/${m}` : m), null)
			.replace('/', '%2F');
	} catch (error) {
		return 'missing-id';
	}
};

export const extractGroupId = (serviceId) =>
	getAvLast(extractServiceId(serviceId).split('/')).reduce(
		(a, r) => `${a}/${r}`,
		''
	);

const getAvLast = ([first, ...rest]) =>
	rest.length === 0
		? []
		: rest.length === 1
			? [first]
			: [first, ...getAvLast(rest)];

export const getParamsFromProps = (props) =>
	props.match && props.match.params ? props.match.params : undefined;
