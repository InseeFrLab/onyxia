
import { getCommitAsyncIterableFactory } from "./getCommitAsyncIterable";
import type { Octokit } from "@octokit/rest";

/** Return the sha of the first common commit between two branches */
export function getCommonOriginFactory(params: { octokit: Octokit; }) {

    const { octokit } = params;

    const { getCommitAsyncIterable } = getCommitAsyncIterableFactory({ octokit });

    async function getCommonOrigin(
        params: {
            owner: string;
            repo: string;
            branch1: string;
            branch2: string;
        }
    ): Promise<{ sha: string; }> {

        const { owner, repo, branch1, branch2 } = params;

        const [
            commitAsyncIterable1,
            commitAsyncIterable2
        ] = ([branch1, branch2] as const)
            .map(branch => getCommitAsyncIterable({ owner, repo, branch }))
            ;


        let shas1: string[] = [];
        let shas2: string[] = [];

        while (true) {

            const [
                itRes1,
                itRes2
            ] =
                await Promise.all(
                    ([commitAsyncIterable1, commitAsyncIterable2] as const)
                        .map(
                            commitAsyncIterable => commitAsyncIterable[Symbol.asyncIterator]()
                                .next()
                        )
                )
                ;

            let sha1: string | undefined = undefined;

            if (!itRes1.done) {

                sha1 = itRes1.value.sha;

                shas1.push(sha1);

            }

            let sha2: string | undefined = undefined;

            if (!itRes2.done) {

                sha2 = itRes2.value.sha;

                shas2.push(sha2);

            }

            if (!!sha1 && shas2.includes(sha1)) {
                return { "sha": sha1 };
            }

            if (!!sha2 && shas1.includes(sha2)) {
                return { "sha": sha2 };
            }

            if (itRes1.done && itRes2.done) {
                throw new Error("No common origin");
            }


        }


    }

    return { getCommonOrigin };


}