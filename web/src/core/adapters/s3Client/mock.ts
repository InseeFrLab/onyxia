import { S3Client } from "core/ports/S3Client";

export const s3client: S3Client = {
    "list": () =>
        Promise.resolve({
            "directories": [],
            "files": []
        }),
    "getToken": () =>
        Promise.resolve({
            "expirationTime": Infinity,
            "accessKeyId": "",
            "secretAccessKey": "",
            "sessionToken": "",
            "acquisitionTime": Date.now()
        }),
    "createBucketIfNotExist": () => Promise.resolve(),
    "uploadFile": () => Promise.resolve(),
    "deleteFile": () => Promise.resolve(),
    "getFileDownloadUrl": () => Promise.resolve("https://example.com")
};
