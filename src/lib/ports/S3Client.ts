/** All path are supposed to start with the bucket name */
export type S3Client = {
    list: (params: { path: string }) => Promise<{
        directories: string[];
        files: string[];
    }>;

    getToken: () => Promise<{
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string;
        expirationTime: number;
    }>;
};
