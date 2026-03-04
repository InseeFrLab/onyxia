export type S3ProfileType = "managed" | "personal";

export type S3ProfileStatus = "ok" | "needsAttention" | "invalid";

export type S3Profile = {
    id: string;
    name: string;
    type: S3ProfileType;
    status?: S3ProfileStatus;
};
