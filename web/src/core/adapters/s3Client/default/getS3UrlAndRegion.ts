import type { DeploymentRegion } from "core/ports/OnyxiaApi";

export function getS3UrlAndRegion(s3Params: DeploymentRegion.S3) {
    return (() => {
        switch (s3Params.type) {
            case "minio":
                return {
                    "url": s3Params.url,
                    "region": s3Params.region ?? "us-east-1"
                };
            case "amazon":
                return {
                    "url": "https://s3.amazonaws.com",
                    "region": s3Params.region
                };
        }
    })();
}
