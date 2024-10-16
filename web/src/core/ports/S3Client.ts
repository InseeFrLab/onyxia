/** All path are supposed to start with /<bucket_name> */

export type S3Object = S3File | S3Directory;

type S3Base = {
    basename: string;
    policy: "public" | "private";
};

type S3File = S3Base & {
    kind: "file";
    size: number | undefined;
    lastModified: Date | undefined;
};

type S3Directory = S3Base & {
    kind: "directory";
};

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

    /** Completed when 100% uploaded */
    uploadFile: (params: {
        blob: Blob;
        path: string;
        onUploadProgress: (params: { uploadPercent: number }) => void;
    }) => Promise<void>;

    deleteFile: (params: { path: string }) => Promise<void>;

    getFileDownloadUrl: (params: {
        path: string;
        validityDurationSecond: number;
    }) => Promise<string>;
};
