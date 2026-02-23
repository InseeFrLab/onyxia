import type { S3Uri } from "core/tools/S3Uri-next";

export type S3Client = {
    getToken: (params: { doForceRenew: boolean }) => Promise<
        | {
              accessKeyId: string;
              secretAccessKey: string;
              sessionToken: string | undefined;
              expirationTime: number | undefined;
              acquisitionTime: number | undefined;
          }
        | undefined
    >;

    /**
     *  In charge of creating bucket if doesn't exist.
     */
    listObjects: (params: {
        s3UriPrefix: S3Uri.Prefix;
    }) => Promise<S3Client.ListObjectsReturn>;

    putObject: (params: {
        s3Uri: S3Uri.Object;
        blob: Blob;
        onUploadProgress: (params: { uploadPercent: number }) => void;
    }) => Promise<void>;

    deleteObject: (params: { s3Uri: S3Uri.Object }) => Promise<void>;

    generateSignedDownloadUrl: (params: {
        s3Uri: S3Uri.Object;
        validityDurationSecond: number;
    }) => Promise<string>;

    getObjectContent: (params: {
        s3Uri: S3Uri.Object;
        range: `bytes=0-${number}` | undefined;
    }) => Promise<{
        stream: ReadableStream;
        size: number | undefined;
        contentType: string | undefined;
    }>;

    getObjectContentType: (params: {
        s3Uri: S3Uri.Object;
    }) => Promise<string | undefined>;

    createBucket: (params: { bucket: string }) => Promise<
        | { isSuccess: true }
        | {
              isSuccess: false;
              errorCase: "already exist" | "access denied" | "unknown";
              errorMessage: string;
          }
    >;
};

export namespace S3Client {
    export type ListObjectsReturn = ListObjectsReturn.Error | ListObjectsReturn.Success;

    export namespace ListObjectsReturn {
        export type Success = {
            isSuccess: true;
            objects: {
                s3Uri: S3Uri.Object;
                lastModified: number;
                size: number;
            }[];
            s3UriPrefixes: S3Uri.Prefix.TerminatedByDelimiter[];
        };

        export namespace Success {
            export type Object = {
                s3Uri: S3Uri.Object;
                lastModified: number;
                size: number;
            };
        }

        export type Error = {
            isSuccess: false;
            errorCase: "access denied" | "no such bucket";
        };
    }
}
