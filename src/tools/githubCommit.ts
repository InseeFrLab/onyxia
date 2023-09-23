import { createLoggedExec } from "./exec";
import { join as pathJoin } from "path";
import * as fs from "fs";
import crypto from "crypto";
import { Mutex } from "async-mutex";

const mutexes: Record<string, Mutex> = {};

const globalMutex = new Mutex();

let isFirstCall = true;

export async function githubCommit(params: {
    repository: `${string}/${string}`;
    token: string;
    ref?: string;
    commitAuthorEmail?: string;
    action: (params: {
        repoPath: string;
    }) => Promise<{ doCommit: false } | { doCommit: true; doAddAll: boolean; message: string }>;
    log?: (message: string) => void;
}): Promise<{ 
    /** The new commit sha, if a commit was made */
    sha: string | undefined; 
}> {
    const {
        repository,
        ref,
        token,
        commitAuthorEmail = "actions@github.com",
        action,
        log = ()=> {}
    } = params;

    const { exec } = createLoggedExec({ log });

    const cacheDir = pathJoin(process.cwd(), "node_modules", ".cache", "githubCommit");

    await globalMutex.runExclusive(async () => {
        if (!isFirstCall) {
            return;
        }

        isFirstCall = false;

        await fs.promises.rm(cacheDir, { "recursive": true, "force": true });

        await fs.promises.mkdir(cacheDir, { "recursive": true });
    });

    const mutexKey = `${repository}${ref ?? ""}`;

    const mutex = (mutexes[mutexKey] ??= new Mutex());

    const sha = await mutex.runExclusive(async function callee(): Promise<string | undefined> {

        const repoHash = crypto
            .createHash("sha1")
            .update(mutexKey)
            .digest("hex");
        const repoPath = pathJoin(cacheDir, repoHash);

        const repoExists = await fs.promises
            .stat(repoPath)
            .then(() => true)
            .catch(() => false);

        const url = `https://${repository.split("/")[0]}:${token}@github.com/${repository}.git`;

        if (!repoExists) {
            // Perform git clone


            if (ref === undefined) {
                await exec(`git clone --depth 1 ${url} ${repoPath}`);
            } else {
                if (isSha(ref)) {
                    await exec(`git clone ${url} ${repoPath}`);
                    await exec(`git checkout ${ref}`, { "cwd": repoPath });
                } else {
                    await exec(`git clone --branch ${ref} --depth 1 ${url} ${repoPath}`);
                }
            }
        } else {
            // Perform git pull

            try {
                await exec(`git pull`, { "cwd": repoPath });
            } catch {
                console.log("There's been a force push, so we're going to re-clone the repo");

                await fs.promises.rm(repoPath, { "recursive": true, "force": true });

                await callee();

                return;
            }
        }

        const changesResult = await action({ repoPath });

        if (!changesResult.doCommit) {
            return undefined;
        }

        await exec(`git config --local user.email "${commitAuthorEmail}"`, {
            "cwd": repoPath
        });
        await exec(`git config --local user.name "${commitAuthorEmail.split("@")[0]}"`, { "cwd": repoPath });

        if (changesResult.doAddAll) {
            await exec(`git add -A`, { "cwd": repoPath });
        }

        //NOTE: This can fail if there are no changes to commit
        try {
            await exec(`git commit -am "${changesResult.message}"`, { "cwd": repoPath });

            await exec(`git push ${url}`, { "cwd": repoPath });
        } catch {
            return undefined;
        }

        const sha = (await exec(`git rev-parse HEAD`, { "cwd": repoPath })).trim();

        return sha;

    });

    return { sha };
};

export class ErrorNoBranch extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}


function isSha(shaish: string): boolean {
    return /^[0-9a-f]{7,40}$/i.test(shaish);
}