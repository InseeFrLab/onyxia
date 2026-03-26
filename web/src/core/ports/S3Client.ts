import type { S3Uri } from "core/tools/S3Uri";
import type { NonPostableEvt } from "evt";

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
    listObjects: (params: { s3Uri: S3Uri }) => Promise<S3Client.ListObjectsReturn>;

    putObject: (params: {
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        blob: Blob;
        onUploadProgress: (params: { uploadPercent: number }) => void;
        evtCancel: NonPostableEvt<void>;
    }) => Promise<void>;

    deleteObject: (params: { s3Uri: S3Uri.NonTerminatedByDelimiter }) => Promise<void>;

    generateSignedDownloadUrl: (params: {
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        validityDurationSecond: number;
    }) => Promise<string>;

    getObjectContent: (params: {
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        range: `bytes=0-${number}` | undefined;
    }) => Promise<{
        stream: ReadableStream;
        size: number | undefined;
        contentType: string | undefined;
    }>;

    getObjectContentType: (params: {
        s3Uri: S3Uri.NonTerminatedByDelimiter;
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
                s3Uri: S3Uri.NonTerminatedByDelimiter;
                lastModified: number;
                size: number;
            }[];
            prefixes: S3Uri.TerminatedByDelimiter[];
        };

        export namespace Success {
            export type Object = {
                s3Uri: S3Uri.NonTerminatedByDelimiter;
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
