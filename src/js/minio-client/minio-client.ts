import axios from 'axios';
import * as Minio from 'minio';
import * as localStorageToken  from "js/utils/localStorageToken";
import { assert } from "evt/tools/typeSafety/assert";
import memoize from "memoizee";
import { env } from "js/env";

const fetchMinioToken = async () => {

	const kcToken = localStorageToken.get();

	assert(kcToken !== undefined);

	const url = `${env.MINIO.BASE_URI}?Action=AssumeRoleWithClientGrants&Token=${kcToken}&DurationSeconds=43200&Version=2011-06-15`;
	const minioResponse = await axios.post(url);

	assert(!!minioResponse.data);

	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(minioResponse.data, 'text/xml');
	const root = xmlDoc.getElementsByTagName(
		'AssumeRoleWithClientGrantsResponse'
	)[0];

	const credentials = root.getElementsByTagName('Credentials')[0];
	const accessKey = credentials.getElementsByTagName('AccessKeyId')[0].childNodes[0]
		.nodeValue;
	const secretAccessKey = credentials.getElementsByTagName('SecretAccessKey')[0]
		.childNodes[0].nodeValue;
	const sessionToken = credentials.getElementsByTagName('SessionToken')[0]
		.childNodes[0].nodeValue;
	const expiration = credentials.getElementsByTagName('Expiration')[0].childNodes[0]
		.nodeValue;


	assert(
		accessKey !== null &&
		secretAccessKey !== null &&
		sessionToken !== null &&
		expiration !== null
	); //TODO

	return { accessKey, secretAccessKey, sessionToken, expiration };
};

export async function getMinioToken() {

	//const minioDataFromStore = getMinioDataFromStore();

	const { store } = await import("js/redux/store");

	const minioDataFromStore = store.getState().user.S3;

	if (
		minioDataFromStore.AWS_EXPIRATION &&
		Date.parse(minioDataFromStore.AWS_EXPIRATION) - Date.now() >= env.MINIO.MINIMUN_DURATION
	) {
		return minioDataFromStore as never; //TODO!!!
	}

	const credentials = await fetchMinioToken();

	const { actions: userActions } = await import("js/redux/user");

	store.dispatch(userActions.newS3Credentials(credentials));

	return credentials;

}


/** Get an instance of Minio.Client, only instantiated the first time */
export const getMinioClient = memoize(
	async () => {

		const credentials = await getMinioToken();

		return new Minio.Client({
			"endPoint": env.MINIO.END_POINT,
			"port": env.MINIO.PORT,
			"useSSL": true,
			"accessKey": credentials.accessKey,
			"secretKey": credentials.secretAccessKey,
			"sessionToken": credentials.sessionToken
		});

	},
	{ "async": true }
);





