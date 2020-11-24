import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { MyFiles } from "./my-files/my-files.container";
import { MyFile } from "./my-file/my-file.container";
import * as minioTools from "js/minio-client/minio-tools";
import { actions } from "js/redux/legacyActions";
import { useDispatch, useSelector, useUserProfile } from "js/redux/hooks";
import { useLocation } from "react-router-dom";


export const NavigationFile: React.FC<{
	match: { params: { bucketName: string; } };
}> = props => {

	const dispatch = useDispatch();
	const [bucketName] = useState(props.match.params.bucketName);

	//NOTE: Exactly the same as window.location.pathname but we can be sure that there is a
	// re-render when it's changed.
	const { pathname: window_location_pathname }= useLocation();

	const { userProfile: { idep } } = useUserProfile();

	const [pathname, setPathname] = useState(decodeURI(window_location_pathname));
	const [racine] = useState(`/mes-fichiers/${bucketName}`);
	const [bucketExist, setBucketExist] = useState(false);
	const userBuckets = useSelector(state => state.myFiles.userBuckets);

	const currentObjects = useSelector(state => state.myFiles.currentObjects);
	const currentDirectories = useSelector(state => state.myFiles.currentDirectories);
	const [isInitializationCompleted, completeInitialization] = useReducer(() => true, false);


	//NOTE: There is a new render when the location is changed
	useEffect(() => {

		const where = decodeURI(window_location_pathname);

		if (where === pathname) {
			return;
		}

		dispatch(
			actions.loadBucketContent({
				bucketName,
				"prefix": where.replace(`${racine}`, ''),
				"rec": false
			})
		);

		setPathname(where);

	},[pathname, dispatch, bucketName, racine, window_location_pathname ] );

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

		if (isInitializationCompleted) {
			return;
		}

		dispatch(actions.startWaiting());

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
