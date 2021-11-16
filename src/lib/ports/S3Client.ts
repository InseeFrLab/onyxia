export type S3Client = {
    getFsApi: (params: { bucketName: string }) => {
        list: (params: { path: string }) => Promise<{
            directories: string[];
            files: string[];
        }>;
    };

    getToken: () => Promise<{
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string;
        expirationTime: number;
    }>;
};
