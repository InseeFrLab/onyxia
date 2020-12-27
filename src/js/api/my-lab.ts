import { Service, Group } from 'js/model';
import { restApiPaths } from "js/restApiPaths";
import { prAxiosInstance } from "lib/setup";

interface ServicesListing {
	apps: Service[];
	groups: Group[];
}

export const getServices = async (groupId?: String) => {
	return await (await prAxiosInstance)
		.get<ServicesListing>(restApiPaths.myServices, {
			params: {
				groupId: groupId,
			},
		})
		.then(({data})=> data)
};

export const getService = async (id: string) => {
	return await (await prAxiosInstance)
		.get<Service>(restApiPaths.getService, {
			params: {
				serviceId: id,
			},
		})
		.then(({data})=> data)
};

export const deleteServices = async (path?: string, bulk?: boolean) => {
	if (path && bulk && !path.startsWith('/')) {
		path = '/' + path;
	}
	return (await prAxiosInstance).delete(`${restApiPaths.deleteService}`, {
		params: {
			path: path,
			bulk: bulk,
		},
	})
	.then(({data})=> data);

};

export const getLogs = async (serviceId: string, taskId: string) => {
	return await (await prAxiosInstance)
		.get<string>(restApiPaths.getLogs, {
			params: {
				serviceId: serviceId,
				taskId: taskId,
			},
		})
		.then(({data})=> data)
};
