import { join as pathJoin, relative as pathRelative } from "pathe";

export function crawlFactory(params: {
    list(params: { directoryPath: string }): Promise<{
        fileBasenames: string[];
        directoryBasenames: string[];
    }>;
}) {
    const { list } = params;

    async function crawlRec(params: { directoryPath: string; filePaths: string[] }) {
        const { directoryPath, filePaths } = params;

        const { directoryBasenames, fileBasenames } = await list({
            directoryPath
        });

        const toPath = (fileOrDirectoryBasename: string) =>
            pathJoin(directoryPath, fileOrDirectoryBasename);

        filePaths.push(...fileBasenames.map(toPath));

        await Promise.all(
            directoryBasenames
                .map(toPath)
                .map(directoryPath => crawlRec({ directoryPath, filePaths }))
        );
    }

    async function crawl(params: {
        directoryPath: string;
    }): Promise<{ filePaths: string[] }> {
        const { directoryPath } = params;

        const filePaths: string[] = [];

        await crawlRec({ directoryPath, filePaths });

        return {
            filePaths: filePaths.map(filePath => pathRelative(directoryPath, filePath))
        };
    }

    return { crawl };
}
