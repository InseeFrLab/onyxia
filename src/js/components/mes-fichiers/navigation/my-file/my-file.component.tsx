import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Typography } from "@mui/material";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import Status from "./status.component";
import Toolbar from "./toolbar.component";
import Details from "./details.component";
import * as minioTools from "js/minio-client/minio-tools";
import * as minioPolicy from "js/minio-client/minio-policy";
import { MyPolicy } from "../my-policy.component";
import "./my-file.scss";
import { id } from "tsafe/id";
import type { actions } from "js/redux/legacyActions";
import type { HandleThunkActionCreator } from "react-redux";
import { routes } from "ui/routes";
import { getS3Url } from "core/adapters/officialOnyxiaApiClient";

export const MyFile: React.FC<{
    file: Blob & { name: string };
    bucketName: string;
    fileName: string;
    path: string;
    startWaiting: HandleThunkActionCreator<typeof actions["startWaiting"]>;
    stopWaiting: HandleThunkActionCreator<typeof actions["stopWaiting"]>;
}> = ({ file, bucketName, fileName, path, startWaiting, stopWaiting }) => {
    // state
    const [policy, setPolicy] = useState<{ Resource: string[] } | undefined>(undefined);
    const [isPublicFile, setIsPublicFile] = useState(false);
    const [isInPublicDirectory, setIsInPublicDirectory] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
    const [expiration, setExpiration] = useState(undefined);
    const [publicSubdirectoriesPath] = useState(() =>
        getPublicSubdirectoriesPath(bucketName)(fileName)
    );
    //
    const minioPath = minioTools.getMinioDirectoryName(bucketName)(`/${fileName}`);

    const minioDownloadUrl = `${getS3Url()}/${bucketName}/${fileName}`;

    // comportements
    const generatePresignedUrl = useCallback(
        () => checkDownloadUrl({ bucketName, fileName }),
        [bucketName, fileName]
    );
    const download = async () => window.open(await generatePresignedUrl());
    const deleteFile = async () => {
        startWaiting();
        minioTools.removeObject({ bucketName, objectName: fileName });
        stopWaiting();
    };

    const removeFromPolicy = async (minioPath: string) => {
        startWaiting();
        try {
            const policy = await minioPolicy.createPolicyWithoutDirectory(bucketName)(
                minioPath
            );
            await minioTools.setBucketPolicy({ bucketName, policy });
            setIsPublicFile(undefined as unknown as any);
        } catch (e) {
            console.log(e);
        } finally {
            stopWaiting();
        }
    };
    const toggleStatus = async () => {
        startWaiting();
        if (isPublicFile) {
            const policy = await minioPolicy.createPolicyWithoutDirectory(bucketName)(
                minioPath
            );
            await minioTools.setBucketPolicy({ bucketName, policy });
        } else {
            const policy = await minioPolicy.createPolicyWithDirectory(bucketName)(
                minioPath
            );
            await minioTools.setBucketPolicy({ bucketName, policy });
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
                fileName
            });
            if (!unmount) {
                if (!check.isInpublicDirectory && !check.isPublicFile) {
                    const url = await generatePresignedUrl();
                    setFileUrl(url);
                    setExpiration(getExpirationString(url) as any);
                } else {
                    setFileUrl(minioDownloadUrl as any);
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
        minioDownloadUrl
    ]);
    return (
        <>
            <div className="en-tete">
                <Typography variant="h2" align="center" color="textPrimary" gutterBottom>
                    {`Votre fichier ${bucketName}/${fileName}`}
                </Typography>
            </div>
            <FilDAriane fil={fil.myFiles(bucketName)(getFilPaths(path))} />
            <div className="contenu mon-fichier">
                <Toolbar
                    linkToParentPathProps={getLinkToParentPath(bucketName, fileName)}
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
                <MyPolicy handleDelete={removeFromPolicy} policy={policy} />
            </div>
        </>
    );
};

/*
 * Examine le statut public du fichier et de ses répertoires parents.
 * ({publicSubdirectoriesPath: [string]}) => (props: object) => ({ isPublicFile: bool, isInpublicDirectory: bool })
 */
const createCheckFileStatus =
    (publicSubdirectoriesPath: string[]) =>
    async ({
        bucketName,
        fileName
    }: {
        bucketName: string;
        fileName: string;
    }): Promise<{
        isPublicFile: boolean;
        isInpublicDirectory: boolean;
        policy: { Resource: string[] } | undefined;
    }> => {
        try {
            const policiesString = await minioTools.getBucketPolicy(bucketName);
            const policies = JSON.parse(policiesString);
            const [policy] = policies.Statement;
            const minioPath = `${minioTools.getMinioDirectoryName(bucketName)(
                `/${fileName}`
            )}`;

            if (policy) {
                const isInpublicDirectory = publicSubdirectoriesPath.reduce(
                    (a, c) => policy.Resource.indexOf(c) !== -1 || a,
                    false
                );
                const isPublicFile = policy.Resource.indexOf(minioPath) !== -1;
                return { isInpublicDirectory, isPublicFile, policy };
            } else {
                return {
                    isPublicFile: false,
                    isInpublicDirectory: false,
                    policy
                };
            }
        } catch ({ code, name }) {
            if (code && name && name === "S3Error" && code === "NoSuchBucketPolicy") {
                await minioTools.initBucketPolicy(bucketName);
                return await createCheckFileStatus(publicSubdirectoriesPath)({
                    bucketName,
                    fileName
                });
            }
            return {
                isPublicFile: false,
                isInpublicDirectory: false,
                policy: undefined
            };
        }
    };

/* */
const checkDownloadUrl = ({
    bucketName,
    fileName
}: {
    bucketName: string;
    fileName: string;
}) =>
    minioTools.presignedGetObject({
        bucketName,
        objectName: fileName
    });

/* */
const getPublicSubdirectoriesPath = (bucketName: string) => (fileName: string) =>
    fileName
        .split("/")
        .filter(t => t.trim().length > 0)
        .reduce((a, c) => [...a, `${a[a.length - 1]}/${c}`], [""])
        .map(p => minioTools.getMinioDirectoryName(bucketName)(`${p}/*`));

/* */
const getExpirationString = (presignedUrl: string) => {
    const u = new URL(presignedUrl);
    const params: any = u.search
        .split("&")
        .filter(p => p.length > 0)
        .reduce((a, r) => {
            const [k, w] = r.split("=");
            return { ...a, [k]: w };
        }, {});
    const start: string = params["X-Amz-Date"];
    const duration = parseInt(params["X-Amz-Expires"]);

    return dayjs(start).locale("fr").add(duration, "s").format("DD/MM/YYYY à h:mm:ss a");
};

/* */
const getLinkToParentPath = (bucketName: string, fileName: string) => {
    const tmp = fileName.split("/");
    if (tmp.length > 1) {
        const last = fileName.replace(`/${tmp[tmp.length - 1]}`, "");
        return routes.myFilesLegacy({ bucketName, "fileOrDirectoryPath": last }).link;
    } else {
        return routes.myFilesLegacy({ bucketName }).link;
    }
};

MyFile.propTypes = {
    bucketName: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired
};

/* */
const getFilPaths = (path: string) =>
    path
        .split("/")
        .filter(f => f.length > 0)
        .reduce(
            (a, f) =>
                a.length === 0
                    ? [{ label: f, path: `/${f}/` }]
                    : [...a, { label: f, path: `${a[a.length - 1].path}${f}/` }],
            id<{ label: string; path: string }[]>([])
        );
