import { S3Client } from "../ports/S3Client";

export function createDummyS3Client(): S3Client {
    return {
        "list": () =>
            Promise.resolve({
                "directories": [],
                "files": [],
                "errors": []
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
}
