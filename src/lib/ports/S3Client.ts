export type S3Client = {
    getToken: () => Promise<{
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string;
        expirationTime: number;
    }>;
};
