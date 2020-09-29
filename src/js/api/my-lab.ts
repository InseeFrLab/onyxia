import { axiosAuth } from 'js/utils';
import { Service, Group } from 'js/model';

import { restApiPaths } from "js/restApiPaths";

interface ServicesListing {
	apps: Service[];
	groups: Group[];
}

export const getServices = async (groupId?: String) => {
	return await axiosAuth
		.get<ServicesListing>(restApiPaths.myServices, {
			params: {
				groupId: groupId,
			},
		})
		.then((resp) => (resp as unknown) as ServicesListing);
};

export const getService = async (id: string) => {
	return await axiosAuth
		.get<Service>(restApiPaths.getService, {
			params: {
				serviceId: id,
			},
		})
		.then((resp) => (resp as unknown) as Service);
};

export const deleteServices = (path?: string, bulk?: boolean) => {
	if (path && bulk && !path.startsWith('/')) {
		path = '/' + path;
	}
	return axiosAuth.delete(`${restApiPaths.deleteService}`, {
		params: {
			path: path,
			bulk: bulk,
		},
	});
};

export const getLogs = async (serviceId: string, taskId: string) => {
	return await axiosAuth
		.get<string>(restApiPaths.getLogs, {
			params: {
				serviceId: serviceId,
				taskId: taskId,
			},
		})
		.then((resp) => (resp as unknown) as string);
};
