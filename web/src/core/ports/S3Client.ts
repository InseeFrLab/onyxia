/** All path are supposed to start with /<bucket_name> */
export type S3Client = {
    url: string;
    pathStyleAccess: boolean;

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

    /** In charge of creating bucket if doesn't exist. */
    list: (params: { path: string }) => Promise<{
        directories: string[];
        files: string[];
    }>;

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
