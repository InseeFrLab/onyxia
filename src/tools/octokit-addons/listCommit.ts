
import type { Octokit } from "@octokit/rest";
import { getCommitAsyncIterableFactory } from "./getCommitAsyncIterable";
import type { Commit } from "./getCommitAsyncIterable";

/** Return the list of commit since given sha (excluded) 
 * ordered from the oldest to the newest */
export function listCommitFactory(
    params: { octokit: Octokit }
) {

    const { octokit } = params;

    const { getCommitAsyncIterable } = getCommitAsyncIterableFactory({ octokit });

     async function listCommit(
        params: {
            owner: string;
            repo: string;
            branch: string;
            sha: string;
        }
    ): Promise<Commit[]> {

        const { owner, repo, branch, sha } = params;

        const commitAsyncIterable = getCommitAsyncIterable({
            owner,
            repo,
            branch
        });

        const commits: Commit[]= [];

        for await (const commit of commitAsyncIterable) {

            if( commit.sha === sha ){
                break;
            }

            commits.push(commit);

        }

        return commits.reverse();

    }

    return { listCommit };

}