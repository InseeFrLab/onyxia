import * as fs from "fs";
import { join as pathJoin } from "path";
import YAML from "yaml";
import { gitClone } from "../../tools/gitClone";
import { Deferred } from "evt/tools/Deferred";
import { helmChartDirBasename } from "../release_helm_chart";

export function getWebDockerhubRepository(
    params: {
        repository: `${string}/${string}`;
        github_token: string;
        sha: string;
    }
) {

    const { repository, github_token, sha } = params;

    const dOut = new Deferred<string>();

    gitClone({
        repository,
        "token": github_token,
        "ref": sha,
        "action": async ({ repoPath }) => {

            dOut.resolve(
                YAML.parse(
                    fs.readFileSync(
                        pathJoin(repoPath, helmChartDirBasename, "values.yaml")
                    ).toString("utf8")
                )["web"]["image"]["repository"]
            );

            return { "doCommit": false };
        }

    });

    return dOut.pr;

}