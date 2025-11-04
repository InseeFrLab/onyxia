export type S3PrefixUrlParsed = {
    bucket: string;
    /** "" | `${string}/` */
    keyPrefix: string;
};

export namespace S3PrefixUrlParsed {
    export function parse(str: string): S3PrefixUrlParsed {
        const match = str.match(/^s3:\/\/([^/]+)(\/?.*)$/);

        if (match === null) {
            throw new Error(`Malformed s3 prefix url: ${str}`);
        }

        const bucket = match[1];

        let keyPrefix = match[2].replace(/^\//, "");

        if (keyPrefix !== "" && !keyPrefix.endsWith("/")) {
            keyPrefix += "/";
        }

        return { bucket, keyPrefix };
    }

    export function stringify(obj: S3PrefixUrlParsed): string {
        const { bucket, keyPrefix } = obj;

        return `s3://${bucket}/${keyPrefix}`;
    }
}
