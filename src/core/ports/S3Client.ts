/** All path are supposed to start with the bucket name */
export type S3Client = {
    getToken: (params: { restrictToBucketName: string | undefined }) => Promise<{
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string;
        expirationTime: number;
        acquisitionTime: number;
    }>;

    /** Memoized */
    createBucketIfNotExist: (bucketName: string) => Promise<void>;

    /** In charge of creating bucket if doesn't exist. */
    list: (params: { path: string }) => Promise<{
        directories: string[];
        files: string[];
    }>;
};
