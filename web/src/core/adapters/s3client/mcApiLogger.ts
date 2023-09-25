import type { ApiLogger } from "core/tools/apiLogger";
import { join as pathJoin, basename as pathBasename } from "path";
import type { S3Client } from "../../ports/S3Client";

export const mcApiLogger: ApiLogger<S3Client> = {
    "initialHistory": [],
    "methods": {
        //TODO, this is dummy
        "list": {
            "buildCmd": ({ path }) => `mc ls s3${pathJoin(path)}`,
            "fmtResult": ({ result: { directories, files } }) =>
                [...directories.map(directory => `${directory}/`), ...files].join("\n")
        },
        "getToken": {
            "buildCmd": ({ restrictToBucketName }) =>
                [
                    `# We generate a token restricted to the bucket ${restrictToBucketName}`,
                    `# See https://docs.min.io/docs/minio-sts-quickstart-guide.html`
                ].join("\n"),
            "fmtResult": ({ result }) => `The token we got is ${JSON.stringify(result)}`
        },
        "createBucketIfNotExist": {
            "buildCmd": bucketName =>
                `# We create the token ${bucketName} if it doesn't exist.`,
            "fmtResult": () => `# Done`
        },
        "uploadFile": {
            "buildCmd": ({ path }) => `mc cp ${pathBasename(path)} s3${path}`,
            "fmtResult": () => `# File uploaded`
        },
        "deleteFile": {
            "buildCmd": ({ path }) => `mc rm s3${path}`,
            "fmtResult": () => `# File deleted`
        },
        "getFileDownloadUrl": {
            "buildCmd": ({ path }) => `mc cp s3${path}`,
            "fmtResult": ({ result: downloadUrl }) => downloadUrl
        }
    }
};
