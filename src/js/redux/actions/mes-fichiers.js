import {
	presignedGetObject,
	getBucketPolicy,
	getBucketContent,
	setBucketPolicy,
	uploadFile,
	removeObject,
} from 'js/minio-client/minio-tools';
import { getDecodedToken } from 'js/utils';
import { PUSHER } from 'js/components/notifications';
import * as constantes from './constantes';

export const getUserStatObject = ({
	bucketName,
	fileName,
}) => async dispatch => {
	// const what = await statObject({ bucketName, fileName });
};

export const loadUserBuckets = idep => async dispatch => {
	const token = await getDecodedToken();
	const { gitlab_group } = token;
	const buckets = Array.isArray(gitlab_group)
		? [
				{ id: idep, description: 'bucket personnel', isPublic: false },
				...transformGitLabGroup(gitlab_group),
		  ]
		: [{ id: idep, description: 'bucket personnel', isPublic: false }];

	dispatch({ type: constantes.USER_BUCKETS_LOADED, payload: { buckets } });

	return buckets;
};

export const loadBucketContent = (
	bucketName,
	prefix,
	rec
) => async dispatch => {
	dispatch(emptyCurrentBucket());
	try {
		const policy = await getBucketPolicy(bucketName);
		dispatch({
			type: constantes.GET_BUCKET_POLICY,
			payload: { bucket: bucketName, policy: JSON.parse(policy) },
		});
	} catch (e) {}
	const stream = await getBucketContent(bucketName, prefix, rec);
	stream.on('data', object => {
		if (object.prefix) {
			dispatch(addDirectoryToCurrentBucket(object));
		} else if (object.name) {
			dispatch(addObjectToCurrentBucket(object));
		}
	});
	stream.on('error', ({ resource }) =>
		PUSHER.push(`Accés refusé : ${resource}`)
	);
};

export const getUserBucketPolicy = bucketName => async dispatch => {
	try {
		const policy = await getBucketPolicy(bucketName);

		dispatch({
			type: constantes.GET_BUCKET_POLICY,
			payload: { bucket: bucketName, policy: JSON.parse(policy) },
		});
	} catch (e) {}
};

export const setUserBucketPolicy = ({
	bucketName,
	policy,
	path,
}) => async dispatch => {
	dispatch({ type: constantes.ADD_WAITING_PATH, payload: { path } });
	await setBucketPolicy({ bucketName, policy });
	const newPolicy = await getBucketPolicy(bucketName);
	dispatch({
		type: constantes.GET_BUCKET_POLICY,
		payload: { bucket: bucketName, policy: JSON.parse(newPolicy) },
	});
	dispatch({ type: constantes.REMOVE_WAITING_PATH, payload: { path } });
};

export const deleteUserBucketPolicy = bucketName => dispatch => {};

export const setCurrentBucket = bucket => ({
	type: constantes.SET_CURRENT_BUCKET,
	payload: { bucket },
});
const emptyCurrentBucket = () => ({ type: constantes.EMPTY_CURRENT_BUCKET });

const addObjectToCurrentBucket = object => ({
	type: constantes.ADD_OBJECT_TO_CURRENT_BUCKET,
	payload: { object },
});
const addDirectoryToCurrentBucket = directory => ({
	type: constantes.ADD_DIRECTORY_TO_CURRENT_BUCKET,
	payload: { directory },
});

export const uploadFileToBucket = ({
	file,
	bucketName,
	notify,
	path,
}) => dispatch =>
	uploadFile({ bucketName, file, notify, path })
		.then(result => {
			if (result) {
				PUSHER.push(`${file.name} a été uploadé.`);
			}
			return result;
		})
		.catch(err => {
			PUSHER.push(`l'upload du fichier ${file.name} a échoué.`);
		});

export const removeObjectFromBucket = ({
	bucketName,
	objectName,
}) => dispatch =>
	removeObject({ bucketName, objectName })
		.then(result => {
			if (result) {
				PUSHER.push(`${objectName} a été supprimé.`);
			}
			return result;
		})
		.catch(err => {
			PUSHER.push(`la suppression du fichier ${objectName} a échoué.`);
		});

export const dowloadObjectFromBucket = ({
	bucketName,
	objectName,
	size,
	notify,
}) => dispatch => {
	presignedGetObject({
		bucketName,
		objectName,
	}).then(url => {
		window.open(url);
	});
};

/*
 *
 */

const transformGitLabGroup = gitLabGroup =>
	gitLabGroup.map(group => transform(group.split(':')));

const transform = ([id, ...rest]) => ({
	id: `groupe-${id}`,
	isPublic: true,
	description: rest.reduce((a, r) => `${a}${r}`, ''),
});
