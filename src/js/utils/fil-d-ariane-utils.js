import React from 'react';
import { extractServiceId } from './service-utils';

export const extractCreateFil = (serviceId) =>
	createFil(extractServiceId(serviceId));

export const createFil = (serviceId) =>
	serviceId
		.split('/')
		.reduce(
			(a, r) =>
				a.length > 0
					? r.length > 0
						? [
								...a,
								{
									path: `${a[a.length - 1].path}/${r}`,
									name: r,
								},
						  ]
						: a
					: [{ path: `${r}`, name: r }],
			[]
		)
		.map((r) => ({
			pathname: `/my-services/${r.path}`,
			component: <span>{r.name}</span>,
		}));

export const createMyLabParentUrl = (serviceId) =>
	concatUrl('/my-service')(extractServiceId(serviceId).split('/'));

const concatUrl = (step) => ([first, ...rest]) =>
	rest.length > 0
		? first.trim().length !== 0
			? concatUrl(`${step}/${first}`)(rest)
			: step
		: step;

export const truncateWithEllipses = (text, max) =>
	text.substr(0, max - 1) + (text.length > max ? '...' : '');
