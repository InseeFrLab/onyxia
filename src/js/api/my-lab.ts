import { axiosAuthTyped } from 'js/utils';
import apiPaths from 'js/configuration/api-paths';
import { Service } from 'js/model';

export const getServices = async () => {
	return await axiosAuthTyped
		.get<{ apps: [] }>(apiPaths.myServices)
		.then((resp) => resp.data.apps);
};

export const deleteService = (service: Service) => {
	return axiosAuthTyped.delete(`${apiPaths.deleteService}`, {
		params: {
			serviceId: service.id,
			type: service.type,
		},
	});
};
