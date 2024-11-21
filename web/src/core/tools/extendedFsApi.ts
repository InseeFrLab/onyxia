import "minimal-polyfills/Object.fromEntries";
import {
    join as pathJoin,
    dirname as pathDirname,
    relative as pathRelative
} from "pathe";
import { crawlFactory } from "core/tools/crawl";

export type BaseFsApi<File> = {
    list: (params: {
        path: string;
    }) => Promise<{ files: string[]; directories: string[] }>;
    deleteFile: (params: { path: string }) => Promise<void>;
    downloadFile: (params: { path: string }) => Promise<File>;
    uploadFile: (params: { path: string; file: File }) => Promise<void>;
};

export type ExtendedFsApi = {
    renameFile: (params: { path: string; newBasename: string }) => Promise<void>;
    renameDirectory: (params: { path: string; newBasename: string }) => Promise<void>;
    createDirectory: (params: { path: string }) => Promise<void>;
    deleteDirectory: (params: { path: string }) => Promise<void>;
};

export function createExtendedFsApi<File>(props: {
    baseFsApi: BaseFsApi<File>;
    keepFileBasename: string;
    keepFile: File;
}): ExtendedFsApi {
    const { baseFsApi, keepFileBasename, keepFile } = props;

    const { crawl } = crawlFactory({
        list: async ({ directoryPath }) => {
            const { directories, files } = await baseFsApi.list({
                path: directoryPath
            });

            return {
                fileBasenames: files,
                directoryBasenames: directories
            };
        }
    });

    async function mvFile(params: { srcPath: string; dstPath: string }) {
        const { srcPath, dstPath } = params;

        if (pathRelative(srcPath, dstPath) === "") {
            return;
        }

        const file = await baseFsApi.downloadFile({
            path: srcPath
        });

        await baseFsApi.deleteFile({
            path: srcPath
        });

        await baseFsApi.uploadFile({
            path: dstPath,
            file
        });
    }

    return {
        renameFile: async ({ newBasename, path }) =>
            mvFile({
                srcPath: path,
                dstPath: pathJoin(pathDirname(path), newBasename)
            }),
        renameDirectory: async ({ newBasename, path }) => {
            const { filePaths } = await crawl({ directoryPath: path });

            await Promise.all(
                filePaths.map(filePath =>
                    mvFile({
                        srcPath: pathJoin(path, filePath),
                        dstPath: pathJoin(pathDirname(path), newBasename, filePath)
                    })
                )
            );
        },
        createDirectory: async ({ path }) =>
            baseFsApi.uploadFile({
                path: pathJoin(path, keepFileBasename),
                file: keepFile
            }),
        deleteDirectory: async ({ path }) => {
            const { filePaths } = await crawl({ directoryPath: path });

            await Promise.all(
                filePaths
                    .map(filePathRelative => pathJoin(path, filePathRelative))
                    .map(filePath =>
                        baseFsApi.deleteFile({
                            path: filePath
                        })
                    )
            );
        }
    };
}
