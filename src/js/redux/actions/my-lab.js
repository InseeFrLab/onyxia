import React from 'react';
import { axiosAuth } from 'js/utils';
import * as constantes from './constantes';
import {
	startWaiting,
	stopWaiting,
	cardStoptWaiting,
	cardStartWaiting,
} from './app';
import { launchServiceTask, needWaitingTask } from 'js/utils';
import api from 'js/redux/api';
import { typeRequest } from 'js/utils';
import { getMinioToken } from 'js/minio-client';
import * as messages from 'js/components/messages';
import { PUSHER } from 'js/components/notifications';

export const setServiceSelected = (service) => ({
	type: constantes.SERVICE_CHARGE,
	payload: { service },
});

export const chargerMonGroupe = (groupId) => (dispatch) => {
	dispatch(startWaiting());
	axiosAuth
		.get(`${api.mesServices}?groupId=${groupId}`)
		.then((groupe) => {
			dispatch(stopWaiting());
			dispatch({ type: constantes.MON_GROUPE_CHARGE, payload: { groupe } });
		})
		.catch(function (error) {
			dispatch(stopWaiting());
			console.log(error);
		});
	return false;
};

export const chargerMesServices = () => (dispatch) => {
	dispatch(startWaiting());
	axiosAuth
		.get(api.mesServices)
		.then(function (services) {
			dispatch(stopWaiting());
			if (services.apps) {
				dispatch(mesServicesLoaded(services));
			}
		})
		.catch(function (error) {
			dispatch(stopWaiting());
			console.log(error);
		});
	return false;
};

const mesServicesLoaded = ({ apps: services, groups: groupes }) => ({
	type: constantes.MES_SERVICES_LOADED,
	payload: { services, groupes },
});

export const setSelectedService = (service) => ({
	type: constantes.SET_SELECTED_SERVICE,
	payload: { service },
});

export const creerNouveauService = (service, options, dryRun = false) => (
	dispatch,
	getState
) => {
	dispatch(startWaiting());
	return axiosAuth
		.put(
			service.category === 'group' ? api.nouveauGroupe : api.nouveauService,
			{
				catalogId: service.catalogId,
				packageName: service.name,
				packageVersion: service.currentVersion,
				dryRun,
				options,
			}
		)
		.then((response) => {
			dispatch(stopWaiting());
			if (!dryRun) {
				PUSHER.push(
					<messages.ServiceCreeMessage
						id={response.id}
						message={service.postInstallNotes}
					/>
				);
			}
			return response;
		})
		.catch((error) => {
			dispatch(stopWaiting());

			PUSHER.push(<messages.ServiceEchecMessage nom={service.name} />);
		});
};

export const changerEtatService = (serviceId, etat, mems, cpus) => async (
	dispatch
) => {
	dispatch(cardStartWaiting(serviceId));

	await axiosAuth.post(api.changerEtatService, {
		serviceId,
		instances: etat ? 1 : 0,
		mems,
		cpus,
	});
	const ellapsed = await launchServiceTask(serviceId)(dispatch);

	PUSHER.push(
		etat ? (
			<messages.ServiceDemarreMessage ellapsed={ellapsed} id={serviceId} />
		) : (
			<messages.ServiceArreteMessage ellapsed={ellapsed} id={serviceId} />
		)
	);
	dispatch(cardStoptWaiting(serviceId));
	return false;
};

export const suivreStatutService = (service) => (dispatch) => {
	if (needWaitingTask(service)) {
		dispatch(cardStartWaiting(service.id));
		launchServiceTask(service.id)(dispatch).then((ellapsed) => {
			PUSHER.push(<messages.ServiceDemarreMessage ellapsed={ellapsed} />);
		});
	}
};

export const requestDeleteMonService = (service) => (dispatch) => {
	const { id } = service;
	dispatch(cardStartWaiting(id));
	return axiosAuth
		.delete(`${api.changerEtatService}?serviceId=${id}`)
		.then((r) => {
			dispatch(cardStoptWaiting(id));
			dispatch(deleteMonService(service));
			PUSHER.push(<messages.ServiceSupprime id={id} />);
			// dispatch(produceMessageInformation(<messages.ServiceSupprime id={id} />));
		});
};

export const updateMonService = (service) => ({
	type: constantes.UPDATE_MON_SERVICE,
	payload: { service },
});

export const deleteMonService = (service) => ({
	type: constantes.DELETE_MON_SERVICE,
	payload: { service },
});

export const stopAllWaitingCards = () => ({
	type: constantes.STOP_ALL_WAITING_CARDS,
});

export const updateServiceProprietesConfEnv = (conf, env) => (dispatch) => {
	const data = { ...conf, env: { ...env } };
	dispatch(startWaiting());

	return axiosAuth
		.post(api.myLab.app, data)
		.then((result) => {
			dispatch(stopWaiting());
		})
		.catch((err) => {
			dispatch(stopWaiting());
			console.error(err);
		});
};

export const refreshMinioToken = (serviceId) => async (dispatch) => {
	const {
		accessKey: AWS_ACCESS_KEY_ID,
		expiration: AWS_EXPIRATION,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
		sessionToken: AWS_SESSION_TOKEN,
	} = await getMinioToken();

	dispatch(
		updateServiceProprietesConfEnv(
			{ serviceId },
			{
				AWS_EXPIRATION,
				AWS_SECRET_ACCESS_KEY,
				AWS_ACCESS_KEY_ID,
				AWS_SESSION_TOKEN,
			}
		)
	);
};

export const supprimerGroupe = (idGroup) => (dispatch) => {
	dispatch(startWaiting());
	return axiosAuth
		.delete(`${api.mesServices}/?serviceId=${idGroup}`)
		.then((result) => {
			dispatch(stopWaiting());
			dispatch(chargerMesServices());
			PUSHER.push(<messages.ServiceSupprime id={idGroup} groupe />);
			if (idGroup.split('/').pop() === 'cloudshell')
				dispatch({
					type: constantes.CLOUDSHELL_STOPPED,
				});
			// dispatch(
			// 	produceMessageInformation(
			// 		<messages.ServiceSupprime id={idGroup} groupe />
			// 	)
			// );
		})
		.catch((err) => {
			dispatch(stopWaiting());
			console.error(err);
		});
};

/*
 * Gestion de l'aiguillage sur la page mes-services : page à urls gigones.
 * /mes-services  ==> page  pour toutes cartes des groups et apps de l'utilisateur.
 * /mes-services/:groupId ==> page des cartes d'un groupe de l'utilisateur.
 * /mes-services/:appId ==> page de détails d'une app.
 * /mes-services/:groupId/..../:appId page de détails d'une app d'un groupe de l'utilisateur.
 */

export const checkRequestMesServices = (params) => (dispatch) => {
	if (!params || Object.entries(params).length === 0) {
		dispatch(checkRequestMesServicesEnded(typeRequest.global)([])([])());
		return false;
	}
	dispatch(startWaiting());
	checkAppOrGroup(params)
		.then(({ type, services, groupes, groupe }) => {
			dispatch(stopWaiting());
			dispatch(checkRequestMesServicesEnded(type)(services)(groupes)(groupe));
		})
		.catch((err) => null);
	return false;
};

const nullTypeResolved = () =>
	Promise.resolve({
		type: null,
		services: [],
		groupes: [],
	});

const typeResolved = (type) => (services) => (groupes) => (groupe = null) => ({
	type,
	services,
	groupes,
	groupe,
});

const checkAppOrGroup = async (params) => {
	console.log(params);
	const { serviceId } = params;
	const lookAtApp = await fetchApp(serviceId);
	if (lookAtApp.app) {
		return typeResolved(typeRequest.app)([lookAtApp.app])([])();
	}
	const lookAtGroup = await fetchGroup(serviceId);
	if (lookAtGroup.apps || lookAtGroup.groups) {
		return typeResolved(typeRequest.group)(lookAtGroup.apps)(
			lookAtGroup.groups
		)(lookAtGroup);
	}
	return nullTypeResolved();
};

const fetchApp = (serviceId) =>
	axiosAuth.get(`${api.changerEtatService}?serviceId=${serviceId}`);

const fetchGroup = (groupId) =>
	axiosAuth.get(`${api.mesServices}?groupId=${groupId}`);

export const browseSandbox = (taskId, path) => async (dispatch) => {
	const sandbox = await axiosAuth.get(
		`${api.task}/${taskId}/browse?path=${path}`
	);
	dispatch({
		type: constantes.BROWSING_DATA,
		payload: { sandbox },
	});

	return sandbox;
};

export const uploadFile = (taskId, path) => async (dispatch) => {
	axiosAuth.get(`${api.task}/${taskId}/transfer?path=${path}`).then((content) =>
		dispatch({
			type: constantes.FILE_UPLOADED,
			payload: { content },
		})
	);
};
export const downloadFile = (taskId, path, download) => async (dispatch) => {
	axiosAuth
		.get(`${api.task}/${taskId}/download?path=${path}`)
		.then((content) => {
			if (download === undefined || download === false)
				dispatch({
					type: constantes.FILE_DOWNLOADED,
					payload: { content },
				});
			else {
				var url = window.URL.createObjectURL(new Blob([content])),
					link = document.createElement('a');
				link.href = url;
				link.setAttribute('download', path.substr(path.lastIndexOf('%2F') + 3));
				document.body.appendChild(link);
				link.click();
			}
		});
};

const checkRequestMesServicesEnded = (type) => (services) => (groupes) => (
	groupe = null
) => ({
	type: constantes.MES_SERVICES_CHECK_REQUEST,
	payload: { type, services, groupes, groupe },
});

export const resetMesServiceTypeRequest = () => ({
	type: constantes.RESET_MES_SERVICES_TYPES_REQUEST,
});
