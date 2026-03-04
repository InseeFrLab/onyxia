export type Bookmark = {
    id: string;
    label: string;
    path: string;
    createdAt?: string;
};

export type BucketType = "personal" | "group" | "read-write" | "read-only";

export type BucketEntry = {
    label: string;
    path: string;
    type: BucketType;
};

export type CreateBookmarkInput = Omit<Bookmark, "id" | "createdAt">;
