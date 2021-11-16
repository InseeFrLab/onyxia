import { S3Client } from "../ports/S3Client";

export function createDummyS3Client(): S3Client {
    return {
        "getFsApi": () => ({
            "list": () =>
                Promise.resolve({
                    "directories": [],
                    "files": [],
                }),
        }),
        "getToken": () =>
            Promise.resolve({
                "expirationTime": Infinity,
                "accessKeyId": "",
                "secretAccessKey": "",
                "sessionToken": "",
            }),
    };
}
