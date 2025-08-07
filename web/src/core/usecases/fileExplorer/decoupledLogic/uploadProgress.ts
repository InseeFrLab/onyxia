export type S3FilesBeingUploaded = {
    directoryPath: string;
    basename: string;
    size: number;
    uploadPercent: number;
}[];

export type UploadProgress = {
    s3FilesBeingUploaded: S3FilesBeingUploaded;
    overallProgress: {
        completedFileCount: number;
        remainingFileCount: number;
        totalFileCount: number;
        uploadPercent: number;
    };
};

export function getUploadProgress(
    s3FilesBeingUploaded: S3FilesBeingUploaded
): UploadProgress {
    const completedFileCount = s3FilesBeingUploaded.map(
        ({ uploadPercent }) => uploadPercent === 100
    ).length;

    const totalSize = s3FilesBeingUploaded
        .map(({ size }) => size)
        .reduce((prev, curr) => prev + curr, 0);

    const uploadedSize = s3FilesBeingUploaded
        .map(({ size, uploadPercent }) => (size * uploadPercent) / 100)
        .reduce((prev, curr) => prev + curr, 0);

    const uploadPercent = totalSize === 0 ? 100 : (uploadedSize / totalSize) * 100;

    return {
        s3FilesBeingUploaded,
        overallProgress: {
            completedFileCount,
            remainingFileCount: s3FilesBeingUploaded.length - completedFileCount,
            totalFileCount: s3FilesBeingUploaded.length,
            uploadPercent: parseFloat(uploadPercent.toFixed(1))
        }
    };
}
