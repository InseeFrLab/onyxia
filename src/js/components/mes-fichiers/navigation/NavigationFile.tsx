import { useState, useEffect, useReducer, useCallback } from "react";
import { MyFiles } from "./my-files/my-files.container";
import { MyFile } from "./my-file/my-file.container";
import * as minioTools from "js/minio-client/minio-tools";
import { actions } from "js/redux/legacyActions";
import { useSelector } from "ui/coreApi";
import { relative as pathRelative } from "path";
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";
import { createGroup } from "type-route";
import { routes } from "ui/routes";
import { useLocation } from "js/utils/reactRouterPolyfills";
import type { Route } from "type-route";
import { useDispatch } from "js/hooks";

NavigationFile.routeGroup = createGroup([routes.myFilesLegacy]);

NavigationFile.getDoRequireUserLoggedIn = true;

export function NavigationFile(props: {
    route: Route<typeof NavigationFile.routeGroup>;
}) {
    const { route } = props;

    const dispatch = useDispatch();
    const [bucketName] = useState(route.params.bucketName);

    const { pathname: window_location_pathname } = useLocation();

    const [pathname, setPathname] = useState(decodeURI(window_location_pathname));
    const [racine] = useState(`/mes-fichiers/${bucketName}`);
    const [bucketExist, setBucketExist] = useState(false);
    const userBuckets = useSelector(state => state.myFiles.userBuckets);

    const currentObjects = useSelector(state => state.myFiles.currentObjects);
    const currentDirectories = useSelector(state => state.myFiles.currentDirectories);
    const [isInitializationCompleted, completeInitialization] = useReducer(
        () => true,
        false,
    );

    //NOTE: There is a new render when the location is changed
    useEffect(() => {
        const where = decodeURI(window_location_pathname);

        if (where === pathname) {
            return;
        }

        dispatch(
            actions.loadBucketContent({
                bucketName,
                "prefix": where.replace(`${racine}`, ""),
                "rec": false,
            }),
        );

        setPathname(where);
    }, [pathname, dispatch, bucketName, racine, window_location_pathname]);

    const refresh = useCallback(() => {
        dispatch(
            actions.loadBucketContent({
                bucketName,
                "prefix": pathname.replace(`${racine}`, ""),
                "rec": false,
            }),
        );
    }, [bucketName, pathname, racine, dispatch]);

    useEffect(() => {
        if (isInitializationCompleted) {
            return;
        }

        dispatch(actions.startWaiting());

        if (!userBuckets) {
            dispatch(actions.loadUserBuckets());

            return;
        }

        let isUnmounted = false;

        (async () => {
            const bucket = userBuckets.find(({ id }) => id === bucketName) ?? {
                "id": bucketName,
            };

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
                    await minioTools.createBucket(bucket.id);

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

        return () => {
            isUnmounted = true;
        };
    }, [isInitializationCompleted, userBuckets, bucketName, refresh, dispatch]);

    if (!bucketExist) {
        return null;
    }

    const here = pathRelative(racine, pathname);
    const file = currentObjects.find(({ name }) => name === here);

    return (
        <LegacyThemeProvider>
            {file ? (
                <MyFile
                    fileName={decodeURI(here)}
                    bucketName={bucketName}
                    file={file}
                    path={decodeURI(pathname.replace(racine, ""))}
                />
            ) : (
                <MyFiles
                    files={currentObjects}
                    directories={currentDirectories}
                    bucketName={bucketName}
                    refresh={refresh}
                    path={pathname.replace(racine, "")}
                />
            )}
        </LegacyThemeProvider>
    );
}
