import axios from 'axios';
import * as Minio from 'minio';
import { assert } from "evt/tools/typeSafety/assert";
import memoize from "memoizee";
import { getEnv } from "js/env";
//import { prKeycloakClient } from "lib/setup";
import { nonNullable } from "evt";

/** We avoid importing app right away to prevent require cycles */
const getKeycloakClient = memoize(
	() => import("lib/setup")
		.then(ns => ns.prKeycloakClient),
	{ "promise": true }
);

const fetchMinioToken = async () => {

	const keycloakClient = await getKeycloakClient();

	assert(keycloakClient.isUserLoggedIn);

	const { accessToken: oidcAccessToken } =
		await keycloakClient.evtOidcTokens.waitFor(nonNullable());

	const url = `${getEnv().MINIO.BASE_URI}?Action=AssumeRoleWithClientGrants&Token=${oidcAccessToken}&DurationSeconds=43200&Version=2011-06-15`;
	const minioResponse = await axios.post(url);

	assert(!!minioResponse.data);

	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(minioResponse.data, 'text/xml');
	const root = xmlDoc.getElementsByTagName(
		'AssumeRoleWithClientGrantsResponse'
	)[0];

	const credentials = root.getElementsByTagName("Credentials")[0];
	const accessKey = credentials.getElementsByTagName("AccessKeyId")[0].childNodes[0]
		.nodeValue;
	const secretAccessKey = credentials.getElementsByTagName("SecretAccessKey")[0]
		.childNodes[0].nodeValue;
	const sessionToken = credentials.getElementsByTagName("SessionToken")[0]
		.childNodes[0].nodeValue;
	const expiration = credentials.getElementsByTagName("Expiration")[0].childNodes[0]
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

	const { actions } = await import("js/redux/legacyActions");
	const store = await import("lib/setup").then(({ prStore }) => prStore);

	const { s3 } = store.getState().user;

	if (
		s3 && (Date.parse(s3.AWS_EXPIRATION) - Date.now()) >= getEnv().MINIO.MINIMUM_DURATION
	) {

		return {
			"accessKey": s3.AWS_ACCESS_KEY_ID,
			"secretAccessKey": s3.AWS_SECRET_ACCESS_KEY,
			"sessionToken": s3.AWS_SESSION_TOKEN,
			"expiration": s3.AWS_EXPIRATION
		};


	}

	const credentials = await fetchMinioToken();

	store.dispatch(actions.newS3Credentials(credentials));

	return credentials;

}


/** Get an instance of Minio.Client, only instantiated the first time */
export const getMinioClient = memoize(
	async () => {

		const credentials = await getMinioToken();

		return new Minio.Client({
			"endPoint": getEnv().MINIO.END_POINT,
			"port": getEnv().MINIO.PORT,
			"useSSL": true,
			"accessKey": credentials.accessKey,
			"secretKey": credentials.secretAccessKey,
			"sessionToken": credentials.sessionToken
		});

	},
	{ "promise": true }
);
