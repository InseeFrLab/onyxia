export type S3UriPrefixObj = {
    bucket: string;
    /**  "" | `${string}/` */
    keyPrefix: string;
};

export function parseS3UriPrefix(params: {
    s3UriPrefix: string;
    strict: boolean;
}): S3UriPrefixObj {
    const { s3UriPrefix, strict } = params;

    const match = s3UriPrefix.match(/^s3:\/\/([^/]+)(\/?.*)$/);

    if (match === null) {
        throw new Error(`Malformed S3 URI Prefix: ${s3UriPrefix}`);
    }

    const bucket = match[1];

    let keyPrefix = match[2];

    if (strict && !keyPrefix.endsWith("/")) {
        throw new Error(
            [
                `Invalid S3 URI Prefix: "${s3UriPrefix}".`,
                `A S3 URI Prefix should end with a "/" character.`
            ].join(" ")
        );
    }

    keyPrefix = match[2].replace(/^\//, "");

    if (keyPrefix !== "" && !keyPrefix.endsWith("/")) {
        keyPrefix += "/";
    }

    const s3UriPrefixObj = { bucket, keyPrefix };

    return s3UriPrefixObj;
}

export function stringifyS3UriPrefixObj(s3UriPrefixObj: S3UriPrefixObj): string {
    return `s3://${s3UriPrefixObj.bucket}/${s3UriPrefixObj.keyPrefix}`;
}

export function getIsS3UriPrefix(str: string): boolean {
    try {
        parseS3UriPrefix({
            s3UriPrefix: str,
            strict: true
        });
    } catch {
        return false;
    }

    return true;
}

export type S3UriObj = {
    bucket: string;
    key: string;
};

export function parseS3Uri(s3Uri: string): S3UriObj {
    if (getIsS3UriPrefix(s3Uri)) {
        throw new Error(`${s3Uri} is a S3 URI Prefix, not a fully qualified S3 URI.`);
    }

    let s3UriPrefixObj: S3UriPrefixObj;

    try {
        s3UriPrefixObj = parseS3UriPrefix({ s3UriPrefix: s3Uri, strict: false });
    } catch {
        throw new Error(`Malformed S3 URI: ${s3Uri}`);
    }

    const s3UriObj: S3UriObj = {
        bucket: s3UriPrefixObj.bucket,
        key: s3UriPrefixObj.keyPrefix.replace(/\/$/, "")
    };

    return s3UriObj;
}
