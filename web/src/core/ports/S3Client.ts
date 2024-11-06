/** All path are supposed to start with /<bucket_name> */

export type S3Object = S3Object.File | S3Object.Directory;

export namespace S3Object {
    export type Base = {
        basename: string;
        policy: "public" | "private";
    };

    export type File = Base & {
        kind: "file";
        size: number | undefined;
        lastModified: Date | undefined;
    };

    export type Directory = Base & {
        kind: "directory";
    };
}
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
        path: string;
    }) => Promise<{ objects: S3Object[]; bucketPolicy: S3BucketPolicy | undefined }>;

    setPathAccessPolicy: (params: {
        path: string;
        policy: "public" | "private";
        currentBucketPolicy: S3BucketPolicy;
    }) => Promise<S3BucketPolicy>;

    /** Completed when 100% uploaded */
    uploadFile: (params: {
        blob: Blob;
        path: string;
        onUploadProgress: (params: { uploadPercent: number }) => void;
    }) => Promise<S3Object.File>;

    deleteFile: (params: { path: string }) => Promise<void>;

    deleteFiles: (params: { paths: string[] }) => Promise<void>;

    getFileDownloadUrl: (params: {
        path: string;
        validityDurationSecond: number;
    }) => Promise<string>;

    // getPresignedUploadUrl: (params: {
    //     path: string;
    //     validityDurationSecond: number;
    // }) => Promise<string>;
};

type s3Action = `s3:${string}`;

export type S3BucketPolicy = {
    Version: "2012-10-17";
    Statement: Array<{
        Effect: "Allow" | "Deny";
        Principal: string | { AWS: string[] };
        Action: s3Action | s3Action[];
        Resource: string[];
        Condition?: Record<string, any>;
    }>;
};
