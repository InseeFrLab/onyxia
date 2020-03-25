import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import { Typography } from '@material-ui/core';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Status from './status.component';
import Toolbar from './toolbar.component';
import Details from './details.component';
import * as minio from 'js/minio-client';
import MyPolicy from './../my-policy.component';
import conf from './../../../../configuration/';
import {
	getMinioDirectoryName,
	createPolicyWithDirectory,
	createPolicyWithoutDirectory,
	initBucketPolicy,
	getBucketPolicy,
	setBucketPolicy,
	removeObject,
} from 'js/minio-client';
import './my-file.scss';

const MINIO_BASE_URI = conf.MINIO.BASE_URI;

const MonFichier = ({
	file,
	bucketName,
	fileName,
	path,
	startWaiting,
	stopWaiting,
}) => {
	// state
	const [policy, setPolicy] = useState(undefined);
	const [isPublicFile, setIsPublicFile] = useState(false);
	const [isInPublicDirectory, setIsInPublicDirectory] = useState(false);
	const [fileUrl, setFileUrl] = useState(undefined);
	const [expiration, setExpiration] = useState(undefined);
	const [publicSubdirectoriesPath] = useState(() =>
		getPublicSubdirectoriesPath(bucketName)(fileName)
	);
	//
	const minioPath = getMinioDirectoryName(bucketName)(`/${fileName}`);
	const minioDownloadUrl = `${MINIO_BASE_URI}/${bucketName}/${fileName}`;

	// comportements
	const generatePresignedUrl = useCallback(
		() => checkDownloadUrl({ bucketName, fileName }),
		[bucketName, fileName]
	);
	const download = async () => window.open(await generatePresignedUrl());
	const deleteFile = async () => {
		startWaiting();
		removeObject({ bucketName, objectName: fileName });
		stopWaiting();
	};

	const removeFromPolicy = async (minioPath) => {
		startWaiting();
		try {
			const policy = await createPolicyWithoutDirectory(bucketName)(minioPath);
			await setBucketPolicy({ bucketName, policy });
			setIsPublicFile(undefined);
		} catch (e) {
			console.log(e);
		} finally {
			stopWaiting();
		}
	};
	const toggleStatus = async () => {
		startWaiting();
		if (isPublicFile) {
			const policy = await createPolicyWithoutDirectory(bucketName)(minioPath);
			await setBucketPolicy({ bucketName, policy });
		} else {
			const policy = await createPolicyWithDirectory(bucketName)(minioPath);
			await setBucketPolicy({ bucketName, policy });
		}
		setIsPublicFile(!isPublicFile);
		stopWaiting();
	};
	// life cycle
	useEffect(() => {
		let unmount = false;
		const fetchStatus = async () => {
			const check = await createCheckFileStatus(publicSubdirectoriesPath)({
				bucketName,
				fileName,
			});
			if (!unmount) {
				if (!check.isInpublicDirectory && !check.isPublicFile) {
					const url = await generatePresignedUrl();
					setFileUrl(url);
					setExpiration(getExpirationString(url));
				} else {
					setFileUrl(minioDownloadUrl);
				}
				setIsPublicFile(check.isPublicFile);
				setIsInPublicDirectory(check.isInpublicDirectory);
				setPolicy(check.policy);
			}
		};
		if (!unmount) fetchStatus();
		return () => {
			unmount = true;
		};
	}, [
		isPublicFile,
		bucketName,
		publicSubdirectoriesPath,
		fileName,
		generatePresignedUrl,
		minioDownloadUrl,
	]);
	return (
		<React.Fragment>
			<div className="en-tete">
				<Typography
					variant="h2"
					align="center"
					color="textPrimary"
					gutterBottom
				>
					{`Votre fichier ${bucketName}/${fileName}`}
				</Typography>
			</div>
			<FilDAriane fil={fil.myFiles(bucketName)(getFilPaths(path))} />
			<div className="contenu mon-fichier">
				<Toolbar
					parentPath={getParentPath(bucketName)(fileName)}
					download={download}
					deleteFile={deleteFile}
				/>
				<Details file={file} />
				<Status
					isPublicFile={isPublicFile}
					isInPublicDirectory={isInPublicDirectory}
					fileUrl={fileUrl}
					expiration={expiration}
					toggleStatus={toggleStatus}
				/>
				<MyPolicy handleDelete={removeFromPolicy} policy={policy} path={path} />
			</div>
		</React.Fragment>
	);
};

/*
 * Examine le statut public du fichier et de ses répertoires parents.
 * ({publicSubdirectoriesPath: [string]}) => (props: object) => ({ isPublicFile: bool, isInpublicDirectory: bool })
 */
const createCheckFileStatus = (publicSubdirectoriesPath) => async ({
	bucketName,
	fileName,
}) => {
	try {
		const policiesString = await getBucketPolicy(bucketName);
		const policies = JSON.parse(policiesString);
		const [policy] = policies.Statement;
		const minioPath = `${getMinioDirectoryName(bucketName)(`/${fileName}`)}`;

		if (policy) {
			const isInpublicDirectory = publicSubdirectoriesPath.reduce(
				(a, c) => policy.Resource.indexOf(c) !== -1 || a,
				false
			);
			const isPublicFile = policy.Resource.indexOf(minioPath) !== -1;
			return { isInpublicDirectory, isPublicFile, policy };
		} else {
			return { isPublicFile: false, isInpublicDirectory: false, policy };
		}
	} catch ({ code, name }) {
		if (code && name && name === 'S3Error' && code === 'NoSuchBucketPolicy') {
			await initBucketPolicy(bucketName);
			return await createCheckFileStatus(publicSubdirectoriesPath)({
				bucketName,
				fileName,
			});
		}
		return {
			isPublicFile: false,
			isInpublicDirectory: false,
			policy: undefined,
		};
	}
};

/* */
const checkDownloadUrl = ({ bucketName, fileName }) =>
	minio.presignedGetObject({
		bucketName,
		objectName: fileName,
	});

/* */
const getPublicSubdirectoriesPath = (bucketName) => (fileName) =>
	fileName
		.split('/')
		.filter((t) => t.trim().length > 0)
		.reduce((a, c) => [...a, `${a[a.length - 1]}/${c}`], [''])
		.map((p) => getMinioDirectoryName(bucketName)(`${p}/*`));

/* */
const getExpirationString = (presignedUrl) => {
	const u = new URL(presignedUrl);
	const params = u.search
		.split('&')
		.filter((p) => p.length > 0)
		.reduce((a, r) => {
			const [k, w] = r.split('=');
			return { ...a, [k]: w };
		}, {});
	const start = params['X-Amz-Date'];
	const duration = parseInt(params['X-Amz-Expires']);

	return Moment(start)
		.locale('fr')
		.add(duration, 's')
		.format('DD/MM/YYYY à h:mm:ss a');
};

/* */
const getParentPath = (bucketName) => (fileName) => {
	const tmp = fileName.split('/');
	if (tmp.length > 1) {
		const last = fileName.replace(`/${tmp[tmp.length - 1]}`, '');
		return `/mes-fichiers/${bucketName}/${last}`;
	} else {
		return `/mes-fichiers/${bucketName}`;
	}
};

MonFichier.propTypes = {
	bucketName: PropTypes.string.isRequired,
	fileName: PropTypes.string.isRequired,
};

/* */
const getFilPaths = (path) =>
	path
		.split('/')
		.filter((f) => f.length > 0)
		.reduce(
			(a, f) =>
				a.length === 0
					? [{ label: f, path: `/${f}/` }]
					: [...a, { label: f, path: `${a[a.length - 1].path}${f}/` }],
			[]
		);

export default MonFichier;
