import * as constantes from './constantes';
import { axiosAuth } from 'js/utils';
import api from 'js/redux/api';
import { creerNouveauService } from './my-lab';
import { getMinioToken } from 'js/minio-client';
import { getVaultToken } from 'js/vault-client';

export const cloudShellChangeVisibility = (visibility) => ({
	type: constantes.CLOUDSHELL_VISIBILITY_CHANGE,
	payload: { visibility },
});

export const refreshCloudShellStatus = () => (dispatch) => {
	axiosAuth(`${api.cloudShell}`)
		.then((data) => {
			dispatch({
				type: constantes.CLOUDSHELL_STATUS_CHANGE,
				payload: data,
			});
			if (data.status === 'DOWN') {
				Promise.all([getVaultToken(), getMinioToken()])
					.then((_) => {
						creerNouveauService(
							{
								...data.packageToDeploy,
								catalogId: data.catalogId,
							},
							{}
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
