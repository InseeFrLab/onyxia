/// <reference path="filereader-stream.d.ts" />
import fileReaderStream from "filereader-stream";

import { Client, PostPolicy } from "minio";

// eslint-disable-next-line import/no-anonymous-default-export
export default (client: Client) => ({
    statObject: ({ bucketName, fileName }: any) =>
        client.statObject(bucketName, fileName),
    isBucketExist: (bucketName: any) => client.bucketExists(bucketName),
    removeBucket: (bucketName: any) => client.removeBucket(bucketName),
    createBucket: (bucket: any) => client.makeBucket(bucket, "us-east-1"),
    listBuckets: () => client.listBuckets(),
    listObjects: (name: any, prefix = "", rec = true) =>
        client.listObjects(name, prefix, rec),
    putObject: ({ file, bucketName, notify, path }: any) =>
        new Promise((resolve, reject) => {
            const stream = fileReaderStream(file);
            stream
                .on("data", (chunk: any) => {
                    if (notify) {
                        notify("data", { size: chunk.length, stream });
                    }
                })
                .on("end", () => {
                    if (notify) {
                        notify("end", { stream });
                    }
                });
            let metadata = {};
            if (file.type && (file.type.includes("video") || file.type.includes("pdf"))) {
                metadata = { "Content-Type": file.type };
            }
            client.putObject(
                bucketName,
                `${path ? `${path}/` : ""}${file.name}`,
                stream,
                file.size,
                metadata,
                (err, etag) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(etag);
                }
            );
        }),
    removeObject: ({ bucketName, objectName }: any) =>
        new Promise((resolve, reject) => {
            client.removeObject(bucketName, objectName, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(true);
            });
        }),
    getObject: ({ bucketName, objectName, notify }: any) =>
        new Promise((resolve, reject) => {
            client.getObject(bucketName, objectName, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                const chunks: any[] = [];
                stream.on("data", chunk => {
                    chunks.push(chunk);
                    if (notify) {
                        notify("data", { size: chunk.length, stream });
                    }
                });
                stream.on("close", () => {
                    if (notify) {
                        notify("close", { stream });
                    }
                    resolve("close");
                });
                stream.on("end", () => {
                    const file = new File(chunks, objectName);
                    if (notify) {
                        notify("end", { file, stream });
                    }
                    resolve(file);
                });
            });
        }),
    presignedGetObject: ({ bucketName, objectName, duration = 3600 }: any) =>
        new Promise((resolve, reject) => {
            client.presignedGetObject(
                bucketName,
                objectName,
                duration,
                (err, presignedUrl) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(presignedUrl);
                }
            );
        }),
    presignedPostBucket: (bucketName: string, keyPrefix: string, duration = 3600) => {
        const policy = new PostPolicy();
        policy.setBucket(bucketName);
        var expires = new Date();
        expires.setSeconds(duration);
        policy.setExpires(expires);
        policy.setKeyStartsWith(keyPrefix + "/");
        return client.presignedPostPolicy(policy);
    },
    getBucketPolicy: (bucket: any) => client.getBucketPolicy(bucket),
    setBucketPolicy: ({ bucketName, policy }: any) =>
        new Promise((resolve, reject) => {
            client.setBucketPolicy(bucketName, JSON.stringify(policy), err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(true);
            });
        })
});
