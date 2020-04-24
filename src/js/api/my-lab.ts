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

export const deleteService = (service: Service) => {
	return axiosAuthTyped.delete(`${apiPaths.deleteService}`, {
		params: {
			serviceId: service.id,
			type: service.type,
		},
	});
};
