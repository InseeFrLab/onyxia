import { assert } from "tsafe/assert";
import { gitClone } from "./gitClone";
import { Deferred } from "evt/tools/Deferred";
import { exec } from "./exec";

export function getShaBranchName(
    params: {
        repository: `${string}/${string}`;
        github_token: string;
        sha: string;
        log: (message: string) => void;
    }
) {

    const { repository, github_token, sha, log } = params;

    const dOut = new Deferred<string>();

    gitClone({
        log,
        repository,
        "token": github_token,
        "ref": sha,
        "action": async ({ repoPath }) => {

            await exec("git fetch origin", { "cwd": repoPath });

            const output = (await exec(`git for-each-ref --contains ${sha} refs/`, { "cwd": repoPath })).trim();

            const split = output.split("/origin/");

            assert(split.length === 2, "Something went wrong trying to get the branch name");

            dOut.resolve(split[1]);

            return { "doCommit": false };
        }

    }).catch(error => dOut.reject(error));

    return dOut.pr;

}