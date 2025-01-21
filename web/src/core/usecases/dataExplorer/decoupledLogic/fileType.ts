const validFileType = ["parquet", "csv", "json"] as const;

export type ValidFileType = (typeof validFileType)[number];

export const isValidFileType = (ext: string): ext is ValidFileType =>
    validFileType.some(validType => validType === ext);
