// app reducer
export const SET_AUTHENTICATED = 'onyxia/app/setAthenticated';
export const AUTHENTICATED_FAIL = 'onyxia/app/authenticationFail';
export const REQUEST_ERROR = 'onyxia/app/requestError';
export const STOP_WAITING = 'onyxia/app/startWaiting';
export const START_WAITING = 'onyxia/app/stopWaiting';
export const SET_REDIRECT_URI = 'onyxia/app/setRedirectUri';
export const DISPLAY_LOGIN = 'onyxia/app/displayLogin';
export const SET_USER_INFO = 'onyxia/app/setUserInfo';
export const APP_RESIZE = 'onyxia/app/appResize';
export const USER_UPDATE = 'onyxia/app/userUpdate';
export const START_VISITE = 'onyxia/app/startVisite';
export const STOP_VISITE = 'onyxia/app/stopVisite';
export const SET_FAVICON = 'onyxia/app/setFavicon';

// public reducer
export const SERVICE_SELECTIONNE = 'onyxia/public/serviceSelectionne';

// my-Lab
export const CATALOGUE_LOADED = 'onyxia/myLab/catalogueLoaded';
export const SET_SELECTED_SERVICE = 'onyxia/myLab/setSelectedService';
export const SERVICE_CHARGE = 'onyxia/myLab/serviceCharge';
export const MES_SERVICES_LOADED = 'onyxia/myLab/mesServicesLoaded';
export const CARD_START_WAITING = 'onyxia/myLab/cardStartWaiting';
export const CARD_STOP_WAITING = 'onyxia/myLab/cardStoptWaiting';
export const UPDATE_MON_SERVICE = 'onyxia/myLab/updateMonService';
export const DELETE_MON_SERVICE = 'onyxia/myLab/deleteMonService';
export const MON_GROUPE_CHARGE = 'onyxia/myLab/monGroupeCharge';
export const STOP_ALL_WAITING_CARDS = 'onyxia/myLab/stopAllWaitingCards';
export const MES_SERVICES_CHECK_REQUEST =
	'onyxia/myLab/checkRequestMesServicesEnded';
export const RESET_MES_SERVICES_TYPES_REQUEST =
	'onyxia/myLab/resetMesServicesTypeRequest';
export const BROWSING_DATA = 'onyxia/myLab/browsingData';
export const FILE_UPLOADED = 'onyxia/myLab/fileUploaded';
export const FILE_DOWNLOADED = 'onyxia/myLab/fileDownloaded';

// mes fichiers
export const USER_BUCKETS_LOADED = 'onyxia/mesFichers/userBucketsLoaded';
export const SET_CURRENT_BUCKET = 'onyxia/mesFichers/setCurrentBucket';
export const EMPTY_CURRENT_BUCKET = 'onyxia/mesFichers/emptyCurrentBucket';
export const ADD_OBJECT_TO_CURRENT_BUCKET =
	'onyxia/mesFichers/addCurrentObject';
export const GET_BUCKET_POLICY = 'onyxia/mesFichers/getBucketPolicy';
export const ADD_WAITING_PATH = 'onyxia/mesFichiers/addWaitingPaths';
export const REMOVE_WAITING_PATH = 'onyxia/mesFichiers/removeWaitingPaths';
export const ADD_DIRECTORY_TO_CURRENT_BUCKET =
	'onyxia/mesFichiers/addDirectoryToCurrentBucket';

// MesSecrets
export const CHECK_VAULT_STATUS = 'onyxia/mesSecrets/checkVaultStatus';
export const GET_VAULT_SECRETS_LIST = 'onyxia/mesSecrets/getVaultSecretsList';
export const GET_VAULT_SECRET = 'onyxia/mesSecrets/getVaultSecret';
export const UPDATE_VAULT_SECRET = 'onyxia/mesSecrets/updateVaultSecret';
export const NEW_VAULT_TOKEN = 'onyxia/mesSecrets/newVaultToken';
export const NEW_VAULT_DATA = 'onyxia/mesSecrets/newVaultData';
export const NEW_PASSWORD_VERSIONS = 'onyxia/mesSecrets/newPasswordVersions';

// Cloudshell
export const CLOUDSHELL_VISIBILITY_CHANGE =
	'onyxia/cloudShell/visibilityChange';
export const CLOUDSHELL_STATUS_CHANGE = 'onyxia/cloudShell/statusChange';
export const CLOUDSHELL_STOPPED = 'onyxia/cloudShell/arrest';

// S3
export const NEW_S3_CREDENTIALS = 'onyxia/S3/newCredentials';
