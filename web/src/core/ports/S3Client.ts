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
     *  In charge of creating bucket if doesn't exist. *
     * @deprecated
     */
    list: (params: { path: string }) => Promise<{
        directories: string[];
        files: string[];
    }>;
    listObjects: (params: { path: string }) => Promise<S3Object[]>;

    putBucketPolicy: (params: { path: string; policy: S3BucketPolicy }) => Promise<void>;

    /** Completed when 100% uploaded */
    uploadFile: (params: {
        blob: Blob;
        path: string;
        onUploadProgress: (params: { uploadPercent: number }) => void;
    }) => Promise<S3Object.File>;

    deleteFile: (params: { path: string }) => Promise<void>;

    getFileDownloadUrl: (params: {
        path: string;
        validityDurationSecond: number;
    }) => Promise<string>;
};

type S3Actions =
    | "s3:AbortMultipartUpload"
    | "s3:BypassGovernanceRetention"
    | "s3:CreateBucket"
    | "s3:DeleteBucket"
    | "s3:DeleteBucketPolicy"
    | "s3:DeleteObject"
    | "s3:DeleteObjectTagging"
    | "s3:GetBucketAcl"
    | "s3:GetBucketPolicy"
    | "s3:GetObject"
    | "s3:GetObjectTagging"
    | "s3:ListBucket"
    | "s3:PutObject"
    | "s3:PutObjectAcl"
    | "s3:PutBucketPolicy"
    | "s3:ReplicateObject"
    | "s3:RestoreObject"
    | "s3:ListMultipartUploadParts"
    | "s3:ListBucketVersions"
    | "s3:ListBucketMultipartUploads"
    | "s3:PutBucketVersioning"
    | "s3:PutBucketTagging"
    | "s3:GetBucketTagging"
    | "s3:*";

export type S3BucketPolicy = {
    Version: "2012-10-17";
    Statement: Array<{
        Effect: "Allow" | "Deny";
        Principal: string | { AWS: string[] };
        Action: S3Actions | S3Actions[];
        Resource: string | string[];
        Condition?: Record<string, any>;
    }>;
};
