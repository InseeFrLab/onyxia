import { axiosAuth } from 'js/utils';
import apiPaths from 'js/configuration/api-paths';
import { Service, Group } from 'js/model';

interface ServicesListing {
	apps: Service[];
	groups: Group[];
}

export const getServices = async (groupId?: String) => {
	return await axiosAuth
		.get<ServicesListing>(apiPaths.myServices, {
			params: {
				groupId: groupId,
			},
		})
		.then((resp) => (resp as unknown) as ServicesListing);
};

export const getService = async (id: string) => {
	return await axiosAuth
		.get<Service>(apiPaths.getService, {
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
	return axiosAuth.delete(`${apiPaths.deleteService}`, {
		params: {
			path: path,
			bulk: bulk,
		},
	});
};

export const getLogs = async (serviceId: string, taskId: string) => {
	return await axiosAuth
		.get<string>(apiPaths.getLogs, {
			params: {
				serviceId: serviceId,
				taskId: taskId,
			},
		})
		.then((resp) => (resp as unknown) as string);
};
