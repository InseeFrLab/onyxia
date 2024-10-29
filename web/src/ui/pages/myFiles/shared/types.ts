export type Item = Item.File | Item.Directory;
export namespace Item {
    export type Base = {
        basename: string;
        policy: "public" | "private";
        isBeingUploaded: boolean;
        isBeingDeleted: boolean;
        isPolicyChanging: boolean;
    };

    export type File = Base & {
        kind: "file";
        size: number | undefined;
        lastModified: Date | undefined;
    };

    export type Directory = Base & {
        kind: "directory";
    };
}

export const viewModes = ["list", "block"] as const;

export type ViewMode = (typeof viewModes)[number];
