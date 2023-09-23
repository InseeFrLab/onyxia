
import type { ReturnType } from "tsafe";
import type { Octokit } from "@octokit/rest";


/*
.sha
.commit.message
.author.type
.author.type !== "User"
*/

/** Alias for the non exported ReposListCommitsResponseData type alias */
export type Commit = ReturnType<Octokit["repos"]["listCommits"]>["data"][number];

const per_page = 30;

/** Iterate over the commits of a repo's branch */
export function getCommitAsyncIterableFactory(params: { octokit: Octokit; }) {

    const { octokit } = params;

    function getCommitAsyncIterable(
        params: {
            owner: string;
            repo: string;
            branch: string;
        }
    ): AsyncIterable<Commit> {

        const { owner, repo, branch } = params;

        let commits: Commit[] = [];

        let page = 0;

        let isLastPage: boolean | undefined = undefined;

        const getReposListCommitsResponseData = (params: { page: number }) =>
            octokit.repos.listCommits({
                owner,
                repo,
                per_page,
                "page": params.page,
                "sha": branch
            }).then(({ data }) => data)
            ;

        return {
            [Symbol.asyncIterator]() {
                return {
                    "next": async ()=> {

                        if (commits.length === 0) {

                            if (isLastPage) {
                                return { "done": true, "value": undefined };
                            }

                            page++;

                            commits = await getReposListCommitsResponseData({ page });

                            if (commits.length === 0) {
                                return { "done": true, "value": undefined };
                            }

                            isLastPage =
                                commits.length !== per_page ||
                                (await getReposListCommitsResponseData({ "page": page + 1 })).length === 0
                                ;

                        }

                        const [commit, ...rest] = commits;

                        commits = rest;

                        return {
                            "value": commit,
                            "done": false
                        };


                    }
                };
            }
        };


    }

    return { getCommitAsyncIterable };

}





