import * as constantes from './constantes';
import { axiosAuth } from 'js/utils';
import api from 'js/redux/api';
import { creerNouveauService } from './my-lab';
import { getMinioToken } from 'js/minio-client';
import { getVaultToken } from 'js/vault-client';
import {
	getOptions,
	getValuesObject,
} from '../../components/my-lab/catalogue/catalogue-navigation/leaf/deploiement/nouveau-service';

export const cloudShellChangeVisibility = (visibility) => ({
	type: constantes.CLOUDSHELL_VISIBILITY_CHANGE,
	payload: { visibility },
});

export const refreshCloudShellStatus = (user) => (dispatch) => {
	axiosAuth(`${api.cloudShell}`)
		.then((data) => {
			dispatch({
				type: constantes.CLOUDSHELL_STATUS_CHANGE,
				payload: data,
			});
			if (String(data.status) === 'DOWN') {
				const service = data.packageToDeploy;
				Promise.all([getVaultToken(), getMinioToken()])
					.then((values) => {
						const minioCredentials = values[1];
						creerNouveauService(
							{
								...service,
								catalogId: data.catalogId,
							},
							getValuesObject(
								getOptions(user, service, minioCredentials, {}).fV
							)
						)(dispatch);
					})
					.catch((_) => {
						creerNouveauService(
							{
								...data.packageToDeploy,
								catalogId: data.catalogId,
							},
							{}
						)(dispatch);
					});
			}
		})
		.catch((err) => console.log(err));
};
