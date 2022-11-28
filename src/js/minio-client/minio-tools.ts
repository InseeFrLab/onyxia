import { getMinioClient } from "./minio-client";
import getMinioApi from "./minio-api";

export const presignedGetObject = async ({ bucketName, objectName }: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api
        .presignedGetObject({ bucketName, objectName })
        .then(url => `${url}&X-Amz-Security-Token=${(client as any).sessionToken}`);
};

export const getUserBuckets = async (idep: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    const exist = await api.isBucketExist(idep);
    if (!exist) {
        await api.createBucket(idep);
    }
    return api.listBuckets().then(buckets => buckets.filter(b => b.name === idep));
};

export const getBucketContent = async (name: any, prefix: any, rec: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.listObjects(name, prefix, rec);
};

export const uploadFile = async ({ file, path, bucketName, notify }: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.putObject({ file, path, bucketName, notify });
};

export const removeObject = async ({ bucketName, objectName }: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.removeObject({ bucketName, objectName });
};

export const getBucketPolicy = async (name: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.getBucketPolicy(name);
};

export const setBucketPolicy = async ({ bucketName, policy }: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.setBucketPolicy({ bucketName, policy });
};

export const statObject = async ({ bucketName, fileName }: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.statObject({ bucketName, fileName });
};

export const isBucketExist = async (bucketName: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.isBucketExist(bucketName);
};

export const createBucket = async (bucketName: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.createBucket(bucketName);
};

export const removeBucket = async (bucketName: any) => {
    const client = await getMinioClient();
    const api = getMinioApi(client);
    return api.removeBucket(bucketName);
};

export const isPublicDirectory = (bucketName: any) => async (directory: any) => {
    try {
        const policy = await getBucketPolicy(bucketName);
        const path = `arn:aws:s3:::${bucketName}${directory}*`;
        const jp = JSON.parse(policy);
        const {
            Statement: [{ Resource }]
        } = jp;
        const find = Resource.find((r: any) => r === path) !== undefined;
        return find;
    } catch (e) {}
    return false;
};

export const removeDirectoryFromPolicy = (bucketName: any) => async (directory: any) => {
    const policyString = await getBucketPolicy(bucketName);
    const policy = JSON.parse(policyString);
    const {
        Statement: [{ Resource }]
    } = policy;
    if (Resource) {
        const index = Resource.indexOf(getMinioDirectoryName(bucketName)(directory));
        if (index !== -1) Resource.splice(index, 1);
        if (Resource.length === 0) delete policy.Statement;
    }
    await setBucketPolicy({ bucketName, policy });
};

export const initBucketPolicy = async (bucketName: any) => {
    await setBucketPolicy({
        bucketName: bucketName,
        policy: { Version: "2012-10-17", Statement: [] }
    });
    return false;
};

export const getMinioDirectoryName = (bucketName: any) => (directory: any) =>
    `arn:aws:s3:::${bucketName}${directory}`;
