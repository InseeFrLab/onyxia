import { describe, expect, it } from "vitest";
import {
    getFilesToUploadFromDataTransfer,
    getFilesToUploadFromFiles
} from "./getFilesToUploadFromDataTransfer";

type Entry = {
    readonly isFile: boolean;
    readonly isDirectory: boolean;
    readonly name: string;
};

describe("getFilesToUploadFromDataTransfer", () => {
    it("recursively reads every directory batch and preserves the root folder", async () => {
        const cover = createFile("cover.png");
        const notes = createFile("notes.txt");
        const rootEntry = createDirectoryEntry("project", [
            [
                createFileEntry(cover),
                createDirectoryEntry("docs", [[createFileEntry(notes)]])
            ],
            []
        ]);

        const files = await getFilesToUploadFromDataTransfer({
            items: [
                {
                    kind: "file",
                    webkitGetAsEntry: () => rootEntry
                } as unknown as DataTransferItem
            ],
            files: []
        });

        expect(files).toEqual([
            { file: cover, relativePathSegments: ["project"] },
            { file: notes, relativePathSegments: ["project", "docs"] }
        ]);
    });

    it("falls back to webkitRelativePath when entry traversal is unavailable", async () => {
        const file = createFile("notes.txt", "project/docs/notes.txt");

        const files = await getFilesToUploadFromDataTransfer({
            items: [
                {
                    kind: "file",
                    getAsFile: () => file
                } as unknown as DataTransferItem
            ],
            files: [file]
        });

        expect(files).toEqual([{ file, relativePathSegments: ["project", "docs"] }]);
    });
});

describe("getFilesToUploadFromFiles", () => {
    it("uses an empty relative path for regular file selections", () => {
        const file = createFile("notes.txt");

        expect(getFilesToUploadFromFiles([file])).toEqual([
            { file, relativePathSegments: [] }
        ]);
    });
});

function createFile(name: string, webkitRelativePath = ""): File {
    return {
        name,
        size: 1,
        webkitRelativePath
    } as File;
}

function createFileEntry(file: File): Entry {
    return {
        isFile: true,
        isDirectory: false,
        name: file.name,
        file: (resolve: (file: File) => void) => resolve(file)
    } as Entry;
}

function createDirectoryEntry(name: string, batches: Entry[][]): Entry {
    return {
        isFile: false,
        isDirectory: true,
        name,
        createReader: () => {
            let batchIndex = 0;

            return {
                readEntries: (resolve: (entries: Entry[]) => void) => {
                    resolve(batches[batchIndex++] ?? []);
                }
            };
        }
    } as Entry;
}
