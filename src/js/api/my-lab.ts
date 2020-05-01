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

export const getService = async (id: string, type?: string) => {
	return await axiosAuthTyped
		.get<Service>(apiPaths.getService, {
			params: {
				serviceId: id,
				type: type,
			},
		})
		.then((resp) => resp.data);
};

export const deleteService = (service: Service) => {
	return axiosAuthTyped.delete(`${apiPaths.deleteService}`, {
		params: {
			serviceId: service.id,
			type: service.type,
		},
	});
};

export const getLogs = async (
	serviceId: string,
	taskId: string,
	type?: string
) => {
	return await axiosAuthTyped
		.get<string>(apiPaths.getLogs, {
			params: {
				serviceId: serviceId,
				taskId: taskId,
				type: type,
			},
		})
		.then((resp) => resp.data);
};
