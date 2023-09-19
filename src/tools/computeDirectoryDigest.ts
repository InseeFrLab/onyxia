
import { crawl } from "./crawl";
import * as crypto from "crypto";
import { join as pathJoin } from "path";
import * as fs from "fs";

export function computeDirectoryDigest(
    params: {
        dirPath: string;
    }
): string {

    const { dirPath } = params;

    return crawl({
        dirPath,
        "returnedPathsType": "relative to dirPath"
    })
        .sort()
        .map(relativeFilePath => ({
            relativeFilePath,
            "contentBuffer": fs.readFileSync(pathJoin(dirPath, relativeFilePath))
        }))
        .map(({ relativeFilePath, contentBuffer }) =>
            crypto
                .createHash("sha1")
                .update(`${relativeFilePath}:${contentBuffer.toString("utf8")}}`)
                .digest("hex")
        )
        .join("|");


}