import axios from "axios";
import * as Minio from "minio";
import { getToken } from "js/utils";
import store from "js/redux/store";
import * as Actions from "js/redux/actions";
import conf from "../configuration";

const MINIO_BASE_URI = conf.MINIO["base-uri"];
const MINIO_END_POINT = conf.MINIO["end-point"];
const MINIO_END_MINIMUM_DURATION_MS = conf.MINIO["minimum-duration"];
const MINIO_PORT = conf.MINIO.port;
let MINIO_CLIENT = null;

const getMinioDataFromStore = () => {
  return store.getState().user.S3;
};

const broadcastNewCredentials = credentials => {
  store.dispatch(Actions.newS3Credentials(credentials));
};

const fetchMinioToken = async () => {
  const kcToken = await getToken();
  const url = `${MINIO_BASE_URI}?Action=AssumeRoleWithClientGrants&Token=${kcToken}&DurationSeconds=43200&Version=2011-06-15`;
  const minioResponse = await axios.post(url);
  let accessKey = null;
  let secretAccessKey = null;
  let sessionToken = null;
  let expiration = null;
  if (minioResponse.data) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(minioResponse.data, "text/xml");
    const root = xmlDoc.getElementsByTagName(
      "AssumeRoleWithClientGrantsResponse"
    )[0];
    const credentials = root.getElementsByTagName("Credentials")[0];
    accessKey = credentials.getElementsByTagName("AccessKeyId")[0].childNodes[0]
      .nodeValue;
    secretAccessKey = credentials.getElementsByTagName("SecretAccessKey")[0]
      .childNodes[0].nodeValue;
    sessionToken = credentials.getElementsByTagName("SessionToken")[0]
      .childNodes[0].nodeValue;
    expiration = credentials.getElementsByTagName("Expiration")[0].childNodes[0]
      .nodeValue;
  }
  return { accessKey, secretAccessKey, sessionToken, expiration };
};

export const getMinioToken = (refreh = false) =>
  getMinioDataFromStore().AWS_EXPIRATION &&
    Date.parse(getMinioDataFromStore().AWS_EXPIRATION) - Date.now() >=
    MINIO_END_MINIMUM_DURATION_MS
    ? Promise.resolve(getMinioDataFromStore())
    : fetchMinioToken().then(credentials => {
      broadcastNewCredentials(credentials);
      return credentials;
    });

const getClient = () =>
  MINIO_CLIENT
    ? Promise.resolve(MINIO_CLIENT)
    : new Promise((resolve, reject) => {
      getMinioToken()
        .then(credentials => {
          MINIO_CLIENT = new Minio.Client({
            endPoint: MINIO_END_POINT,
            port: MINIO_PORT,
            useSSL: true,
            accessKey: credentials.accessKey,
            secretKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken
          });
          resolve(MINIO_CLIENT);
        })
        .catch(err => reject(err));
    });

export default getClient;
