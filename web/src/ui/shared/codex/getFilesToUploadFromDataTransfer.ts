export type FileToUpload = {
    file: File;
    relativePathSegments: string[];
};

type DataTransferItemWithWebkitGetAsEntry = DataTransferItem & {
    webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

type FileSystemEntryLike = {
    readonly isFile: boolean;
    readonly isDirectory: boolean;
    readonly name: string;
};

type FileSystemFileEntryLike = FileSystemEntryLike & {
    readonly isFile: true;
    readonly isDirectory: false;
    file: (
        successCallback: (file: File) => void,
        errorCallback?: (error: DOMException) => void
    ) => void;
};

type FileSystemDirectoryEntryLike = FileSystemEntryLike & {
    readonly isFile: false;
    readonly isDirectory: true;
    createReader: () => FileSystemDirectoryReaderLike;
};

type FileSystemDirectoryReaderLike = {
    readEntries: (
        successCallback: (entries: FileSystemEntryLike[]) => void,
        errorCallback?: (error: DOMException) => void
    ) => void;
};

export function getFilesToUploadFromFiles(files: readonly File[]): FileToUpload[] {
    return files.map(file => ({
        file,
        relativePathSegments: file.webkitRelativePath
            .split("/")
            .filter(Boolean)
            .slice(0, -1)
    }));
}

export function getHasDraggedFiles(dataTransfer: DataTransfer): boolean {
    if (dataTransfer.items.length !== 0) {
        return Array.from(dataTransfer.items).some(item => item.kind === "file");
    }

    return dataTransfer.types.includes("Files");
}

export async function getFilesToUploadFromDataTransfer(params: {
    items: readonly DataTransferItem[];
    files: readonly File[];
}): Promise<FileToUpload[]> {
    const { items, files } = params;
    const fileItems = items.filter(item => item.kind === "file");
    const itemsWithEntries = fileItems.map(item => ({
        item,
        entry: getFileSystemEntry(item)
    }));
    const hasFileSystemEntrySupport = itemsWithEntries.some(
        ({ entry }) => entry !== null
    );

    if (!hasFileSystemEntrySupport) {
        return getFilesToUploadFromFiles(files);
    }

    return (
        await Promise.all(
            itemsWithEntries.map(async ({ item, entry }) => {
                if (entry !== null) {
                    return getFilesToUploadFromFileSystemEntry({
                        entry,
                        relativePathSegments: []
                    });
                }

                const file = item.getAsFile();

                return file === null ? [] : getFilesToUploadFromFiles([file]);
            })
        )
    ).flat();
}

function getFileSystemEntry(item: DataTransferItem): FileSystemEntryLike | null {
    return (item as DataTransferItemWithWebkitGetAsEntry).webkitGetAsEntry?.() ?? null;
}

function readFileEntry(entry: FileSystemFileEntryLike): Promise<File> {
    return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function readDirectoryEntries(
    entry: FileSystemDirectoryEntryLike
): Promise<FileSystemEntryLike[]> {
    const reader = entry.createReader();
    const entries: FileSystemEntryLike[] = [];

    return new Promise((resolve, reject) => {
        const readNextBatch = () => {
            reader.readEntries(batch => {
                if (batch.length === 0) {
                    resolve(entries);
                    return;
                }

                entries.push(...batch);
                readNextBatch();
            }, reject);
        };

        readNextBatch();
    });
}

async function getFilesToUploadFromFileSystemEntry(params: {
    entry: FileSystemEntryLike;
    relativePathSegments: string[];
}): Promise<FileToUpload[]> {
    const { entry, relativePathSegments } = params;

    if (entry.isFile) {
        const file = await readFileEntry(entry as FileSystemFileEntryLike);

        return [{ file, relativePathSegments: [...relativePathSegments] }];
    }

    const directoryEntry = entry as FileSystemDirectoryEntryLike;
    const childEntries = await readDirectoryEntries(directoryEntry);
    const childRelativePathSegments = [...relativePathSegments, directoryEntry.name];

    return (
        await Promise.all(
            childEntries.map(childEntry =>
                getFilesToUploadFromFileSystemEntry({
                    entry: childEntry,
                    relativePathSegments: childRelativePathSegments
                })
            )
        )
    ).flat();
}
