import conf from '../configuration';
export { default as getKeycloak } from './keycloak-config';
export * from './axios-config';
export * from './form-field';
export * from './object';
export * from './promise';
export * from './promise-wrapper';
export * from './storage-token';
export * from './service-utils';
export * from './fil-d-ariane-utils';
export * from './token-local-storage';
export { default as typeRequest } from './mes-services-types-request';

const grafanaBaseUri = conf.APP.GRAFANA_URI;

const makeParamFromIdService = (id) =>
	id
		.split('/')
		.filter((s) => s.trim().length > 0)
		.join('_');

export const getGrafanaServiceUrl = (service) =>
	`${grafanaBaseUri}${makeParamFromIdService(service.id)}`;
