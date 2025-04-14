import { join as pathJoin, relative as pathRelative } from "pathe";

export function crawlFactory(params: {
    list(params: { directoryPath: string }): Promise<{
        fileBasenames: string[];
        directoryBasenames: string[];
    }>;
}) {
    const { list } = params;

    async function crawlRec(params: {
        directoryPath: string;
        filePaths: string[];
        directoryPaths: string[];
    }) {
        const { directoryPath, filePaths, directoryPaths } = params;

        const { directoryBasenames, fileBasenames } = await list({
            directoryPath
        });

        const toPath = (fileOrDirectoryBasename: string) => {
            return pathJoin(directoryPath, fileOrDirectoryBasename);
        };

        filePaths.push(...fileBasenames.map(toPath));

        await Promise.all(
            directoryBasenames.map(toPath).map(directoryPath => {
                directoryPaths.push(directoryPath);
                return crawlRec({ directoryPath, filePaths, directoryPaths });
            })
        );
    }

    async function crawl(params: {
        directoryPath: string;
    }): Promise<{ filePaths: string[]; directoryPaths: string[] }> {
        const { directoryPath } = params;

        const filePaths: string[] = [];
        const directoryPaths: string[] = [directoryPath];

        await crawlRec({ directoryPath, filePaths, directoryPaths });

        return {
            filePaths: filePaths.map(filePath => pathRelative(directoryPath, filePath)),
            directoryPaths: directoryPaths.map(dirPath =>
                pathRelative(directoryPath, dirPath)
            )
        };
    }

    return { crawl };
}
