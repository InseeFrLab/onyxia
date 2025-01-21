export const supportedFileTypes = ["parquet", "csv", "json"] as const;

export type SupportedFileType = (typeof supportedFileTypes)[number];

export const getIsSupportedFileType = (ext: string): ext is SupportedFileType =>
    supportedFileTypes.some(validType => validType === ext);
