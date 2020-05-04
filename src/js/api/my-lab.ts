import { axiosAuthTyped } from 'js/utils';
import apiPaths from 'js/configuration/api-paths';
import { Service, Group } from 'js/model';

interface ServicesListing {
	apps: Service[];
	groups: Group[];
}

export const getServices = async (groupId?: String) => {
	return await axiosAuthTyped
		.get<ServicesListing>(apiPaths.myServices, {
			params: {
				groupId: groupId,
			},
		})
		.then((resp) => resp.data);
};

export const getService = async (id: string) => {
	return await axiosAuthTyped
		.get<Service>(apiPaths.getService, {
			params: {
				serviceId: id,
			},
		})
		.then((resp) => resp.data);
};

export const deleteServices = (path?: string, bulk?: boolean) => {
	if (path && !path.startsWith('/')) {
		path = '/' + path;
	}
	return axiosAuthTyped.delete(`${apiPaths.deleteService}`, {
		params: {
			path: path,
			bulk: bulk,
		},
	});
};

export const getLogs = async (serviceId: string, taskId: string) => {
	return await axiosAuthTyped
		.get<string>(apiPaths.getLogs, {
			params: {
				serviceId: serviceId,
				taskId: taskId,
			},
		})
		.then((resp) => resp.data);
};
