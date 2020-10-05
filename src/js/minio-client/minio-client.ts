import axios from 'axios';
import * as Minio from 'minio';
import * as localStorageToken  from "js/utils/localStorageToken";
import { store } from 'js/redux/store';
import { actions as userActions } from "js/redux/user";
import { assert } from "evt/tools/typeSafety/assert";


import { env } from "js/env";

const MINIO_BASE_URI = env.MINIO.BASE_URI;
const MINIO_END_POINT = env.MINIO.END_POINT;
const MINIO_END_MINIMUM_DURATION_MS = env.MINIO.MINIMUN_DURATION;
const MINIO_PORT = env.MINIO.PORT;
let MINIO_CLIENT: Minio.Client | null = null;

const getMinioDataFromStore = () => {
	return store.getState().user.S3;
};

const broadcastNewCredentials = (credentials: any) => {
	store.dispatch(userActions.newS3Credentials(credentials));
};

const fetchMinioToken = async () => {
	const kcToken = localStorageToken.get();
	const url = `${MINIO_BASE_URI}?Action=AssumeRoleWithClientGrants&Token=${kcToken}&DurationSeconds=43200&Version=2011-06-15`;
	const minioResponse = await axios.post(url);
	let accessKey = null;
	let secretAccessKey = null;
	let sessionToken = null;
	let expiration = null;
	if (minioResponse.data) {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(minioResponse.data, 'text/xml');
		const root = xmlDoc.getElementsByTagName(
			'AssumeRoleWithClientGrantsResponse'
		)[0];
		const credentials = root.getElementsByTagName('Credentials')[0];
		accessKey = credentials.getElementsByTagName('AccessKeyId')[0].childNodes[0]
			.nodeValue;
		secretAccessKey = credentials.getElementsByTagName('SecretAccessKey')[0]
			.childNodes[0].nodeValue;
		sessionToken = credentials.getElementsByTagName('SessionToken')[0]
			.childNodes[0].nodeValue;
		expiration = credentials.getElementsByTagName('Expiration')[0].childNodes[0]
			.nodeValue;
	}
	return { accessKey, secretAccessKey, sessionToken, expiration };
};

export const getMinioToken = () => {

	const minioDataFromStore = getMinioDataFromStore();

	return minioDataFromStore.AWS_EXPIRATION &&
		Date.parse(minioDataFromStore.AWS_EXPIRATION) - Date.now() >= MINIO_END_MINIMUM_DURATION_MS ? 
		Promise.resolve(minioDataFromStore) as never //TODO!!!
		: 
		fetchMinioToken().then((credentials) => {
			broadcastNewCredentials(credentials);
			return credentials;
		});

}

const getClient = (): Promise<Minio.Client> =>
	MINIO_CLIENT
		? Promise.resolve(MINIO_CLIENT)
		:
			getMinioToken().then(credentials => {

					assert(
						credentials.accessKey !== null && 
						credentials.secretAccessKey !== null && 
						credentials.sessionToken !== null
					); //TODO


					MINIO_CLIENT = new Minio.Client({
						endPoint: MINIO_END_POINT,
						port: MINIO_PORT,
						useSSL: true,
						accessKey: credentials.accessKey,
						secretKey: credentials.secretAccessKey,
						sessionToken: credentials.sessionToken
					});
					return MINIO_CLIENT;

				});


export default getClient;
