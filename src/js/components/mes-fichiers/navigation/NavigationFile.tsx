import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { MyFiles } from "./my-files/my-files.container";
import { MyFile } from "./my-file/my-file.container";
import * as minioTools from "js/minio-client/minio-tools";
import { actions, useSelector, useDispatch } from "js/redux/store";

export const NavigationFile: React.FC<{
	match: { params: { bucketName: string; } };
}> = props => {

	const dispatch = useDispatch();
	const [bucketName] = useState(props.match.params.bucketName);
	const [pathname, setPathname] = useState(decodeURI(window.location.pathname));
	const [racine] = useState(`/mes-fichiers/${bucketName}`);
	const [bucketExist, setBucketExist] = useState(false);
	const userBuckets = useSelector(state => state.myFiles.userBuckets);
	const idep = useSelector(state => state.user.IDEP);
	const currentObjects = useSelector(state => state.myFiles.currentObjects);
	const currentDirectories = useSelector(state => state.myFiles.currentDirectories);

	const [isInitializationCompleted, completeInitialization] = useReducer(() => true, false);

	const refresh = useCallback(() => {

		dispatch(
			actions.loadBucketContent({
				bucketName,
				"prefix": pathname.replace(`${racine}`, ''),
				"rec": false
			})
		);

	}, [bucketName, pathname, racine, dispatch]);

	useEffect(() => {

		const where = decodeURI(window.location.pathname);

		if (where === pathname) {
			return;
		}

		refresh();

		setPathname(where);


	}, [pathname, refresh]);



	useEffect(() => {

		if (isInitializationCompleted) {
			return;
		}

		dispatch(actions.startWaiting());

		if (idep === undefined) {

			dispatch(actions.getUserInfo());

			return;

		}

		if (!userBuckets) {

			dispatch(actions.loadUserBuckets({ "idep": idep }));

			return;

		}

		let isUnmounted = false;

		(async () => {

			const bucket = userBuckets.find(({ id }) => id === bucketName) ??
				{ "id": bucketName };

			// eslint-disable-next-line
			walk: {

				if (!bucket) {
					// eslint-disable-next-line
					break walk;
				}

				const doesBucketExist = await minioTools.isBucketExist(bucket.id);

				if (isUnmounted) {
					return;
				}

				if (!doesBucketExist) {

					await minioTools.createBucket(bucket.id)

					if (isUnmounted) {
						return;
					}


				}


				setBucketExist(true);

				refresh();

			}

			dispatch(actions.stopWaiting());

			completeInitialization();

		})();

		return () => { isUnmounted = true };



	}, [isInitializationCompleted, idep, userBuckets, bucketName, refresh, dispatch]);


	if (!bucketExist) {
		return null;
	}

	const here = pathname.replace(racine, '');
	const file = currentObjects.find(({ name }) => name === here);

	/*
	if( 1 === 1 + 1 ){
		console.log( file, currentDirectories, MyFile, MyFiles );
	}

	return <></>;
	*/
	return file ? (
		<MyFile
			fileName={decodeURI(here).substr(1)}
			bucketName={bucketName}
			file={file}
			path={decodeURI(pathname.replace(racine, ''))}
		/>
	) : (
			<MyFiles
				files={currentObjects}
				directories={currentDirectories}
				bucketName={bucketName}
				refresh={refresh}
				path={pathname.replace(racine, '')}
			/>
		);


};
