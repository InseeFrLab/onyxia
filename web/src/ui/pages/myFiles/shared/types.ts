export type Item = File | Directory;

export type File = {
    kind: "file";
    size: number | undefined;
    lastModified: Date | undefined;
    basename: string;
    policy: "public" | "private";
};

export type Directory = {
    kind: "directory";
    basename: string;
    policy: "public" | "private";
};

export const viewModes = ["list", "block"] as const;

export type ViewMode = (typeof viewModes)[number];
