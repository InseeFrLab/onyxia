export type S3UriPrefixObj = {
    type: "s3 URI prefix";
    bucket: string;
    keySegments: string[];
    delimiter: string;
};

export function parseS3UriPrefix(params: {
    s3UriPrefix: string;
    delimiter: string;
    strict: boolean;
}): S3UriPrefixObj {
    const { s3UriPrefix, delimiter, strict } = params;

    const match = s3UriPrefix.match(/^s3:\/\/([^/]+)(\/?.*)$/);

    if (match === null) {
        throw new Error(`Malformed S3 URI Prefix: ${s3UriPrefix}`);
    }

    const bucket = match[1];

    let keyPrefix = match[2];

    if (strict && !keyPrefix.endsWith(delimiter)) {
        throw new Error(
            [
                `Invalid S3 URI Prefix: "${s3UriPrefix}".`,
                `A S3 URI Prefix should end with a "/" character.`
            ].join(" ")
        );
    }

    if (keyPrefix.startsWith(delimiter)) {
        keyPrefix = keyPrefix.slice(delimiter.length);
    }

    if (keyPrefix !== "" && !keyPrefix.endsWith(delimiter)) {
        keyPrefix += delimiter;
    }

    const keySegments =
        keyPrefix === ""
            ? []
            : keyPrefix.split(delimiter).filter(segment => segment !== "");

    const s3UriPrefixObj: S3UriPrefixObj = {
        type: "s3 URI prefix",
        bucket,
        keySegments,
        delimiter
    };

    return s3UriPrefixObj;
}

export function stringifyS3UriPrefixObj(s3UriPrefixObj: S3UriPrefixObj): string {
    const { bucket, keySegments, delimiter } = s3UriPrefixObj;

    const keyPrefix = keySegments.join(delimiter);

    return `s3://${bucket}/${keyPrefix === "" ? "" : `${keyPrefix}/`}`;
}

export function stringifyS3UriObj(s3UriObj: S3UriObj): string {
    const s3UriPrefixObj: S3UriPrefixObj = {
        type: "s3 URI prefix",
        delimiter: s3UriObj.delimiter,
        bucket: s3UriObj.bucket,
        keySegments: s3UriObj.keySegments
    };

    return `${stringifyS3UriPrefixObj(s3UriPrefixObj)}${s3UriObj.basename}`;
}

export function getIsS3UriPrefix(str: string): boolean {
    try {
        parseS3UriPrefix({
            s3UriPrefix: str,
            strict: true,
            delimiter: "/"
        });
    } catch {
        return false;
    }

    return true;
}

export type S3UriObj = {
    type: "s3 URI";
    bucket: string;
    keySegments: string[];
    basename: string;
    delimiter: string;
};

export function parseS3Uri(params: { s3Uri: string; delimiter: string }): S3UriObj {
    const { s3Uri, delimiter } = params;

    if (getIsS3UriPrefix(s3Uri)) {
        throw new Error(`${s3Uri} is a S3 URI Prefix, not a fully qualified S3 URI.`);
    }

    let s3UriPrefixObj: S3UriPrefixObj;

    try {
        s3UriPrefixObj = parseS3UriPrefix({
            s3UriPrefix: s3Uri,
            strict: false,
            delimiter
        });
    } catch {
        throw new Error(`Malformed S3 URI: ${s3Uri}`);
    }

    const [basename, ...rest] = s3UriPrefixObj.keySegments.reverse();

    const s3UriObj: S3UriObj = {
        type: "s3 URI",
        bucket: s3UriPrefixObj.bucket,
        keySegments: rest.reverse(),
        basename,
        delimiter
    };

    return s3UriObj;
}

export function getIsInside(params: {
    s3UriPrefixObj: S3UriPrefixObj;
    s3UriObj: S3UriObj;
}): { isInside: false; isTopLevel?: never } | { isInside: true; isTopLevel: boolean } {
    const { s3UriPrefixObj, s3UriObj } = params;

    let i;

    for (i = 0; i < s3UriPrefixObj.keySegments.length; i++) {
        const keyPrefix = s3UriObj.keySegments[i];

        if (keyPrefix === undefined) {
            return { isInside: false };
        }

        const keySegment_prefix = s3UriPrefixObj.keySegments[i];

        if (keyPrefix !== keySegment_prefix) {
            return { isInside: false };
        }
    }

    return {
        isInside: true,
        isTopLevel: i === s3UriObj.keySegments.length
    };
}
