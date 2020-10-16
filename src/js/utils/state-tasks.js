import dayjs from 'dayjs';
import { axiosAuth } from 'js/utils';
import { updateMonService, cardStoptWaiting } from 'js/redux/actions';
import api from 'js/redux/api';

let SERVICE_TASKS = {};

// window.setInterval(() => console.log(SERVICE_TASKS), 5000);

export const launchServiceTask = (serviceId) => (dispatch) => {
	if (isServiceWaitingTask(SERVICE_TASKS)(serviceId))
		return Promise.resolve(false);
	return task(SERVICE_TASKS)(serviceId)(dispatch);
};

export const needWaitingTask = (service) => {
	if (
		isServiceWaiting(service) &&
		!isServiceWaitingTask(SERVICE_TASKS)(service.id)
	)
		return true;
	return false;
};

const task = (memory) => (serviceId) => (dispatch) => {
	return new Promise((resolve, reject) => {
		const startAt = dayjs().valueOf();
		const reload = (num) => {
			if (isRunningTask(serviceId)(memory)) {
				clearTask(serviceId)(memory);
			}
			const timerId = window.setTimeout(
				() => {
					const id = serviceId
						.split('/')
						.filter((a, i) => i > 2)
						.reduce((a, m) => `${a}/${m}`, '');
					axiosAuth
						.get(`${api.changerEtatService}?serviceId=${id}`)
						.then(({ app: service }) => {
							delete memory[serviceId];
							if (!isServiceWaiting(service)) {
								dispatch(cardStoptWaiting(serviceId));
								dispatch(updateMonService({ service }));
								resolve(dayjs().valueOf() - startAt);
							} else {
								reload(num + 1);
							}
						})
						.catch(function (error) {
							delete memory[serviceId];
							reject(error);
						});
				},
				!num ? 1000 : 2000 * num
			);
			memory[serviceId] = timerId;
		};
		reload(0);
	});
};

const isServiceWaitingTask = (memory) => (serviceId) => serviceId in memory;
const isRunningTask = (serviceId) => (memory) => serviceId in memory;
const clearTask = (serviceId) => (memory) => {
	if (serviceId in memory) {
		window.clearTimeout(memory[serviceId]);
		delete memory[serviceId];
	}
};
export const isServiceWaiting = (service) =>
	service && service.status === 'DEPLOYING';

export const isGroupWaiting = (group) =>
	group &&
	group.apps.find((service) => isServiceWaiting(service)) !== undefined;
