
import type { ReturnType } from "tsafe";
import type { Octokit } from "@octokit/rest";



/** Alias for the non exported PullsListResponseData type alias */
export type PullRequest = ReturnType<Octokit["pulls"]["list"]>["data"][number];

const per_page = 99;

export function getPullRequestAsyncIterableFactory(params: { octokit: Octokit; }) {

    const { octokit } = params;

    function getPullRequestAsyncIterable(
        params: {
            owner: string;
            repo: string;
            state: "open" | "closed" | "all"
        }
    ): AsyncIterable<PullRequest> {

        const { owner, repo, state } = params;

        let pullRequests: PullRequest[] = [];

        let page = 0;

        let isLastPage: boolean | undefined = undefined;

        const getPullsListResponseData = (params: { page: number }) =>
            octokit.pulls.list({
                owner,
                repo,
                state,
                per_page,
                "page": params.page
            }).then(({ data }) => data)
            ;

        return {
            [Symbol.asyncIterator]() {
                return {
                    "next": async ()=> {

                        if (pullRequests.length === 0) {

                            if (isLastPage) {
                                return { "done": true, "value": undefined };
                            }

                            page++;

                            pullRequests = await getPullsListResponseData({ page });

                            if (pullRequests.length === 0) {
                                return { "done": true, "value": undefined };
                            }

                            isLastPage =
                                pullRequests.length !== per_page ||
                                (await getPullsListResponseData({ "page": page + 1 })).length === 0
                                ;

                        }

                        const [pullRequest, ...rest] = pullRequests;

                        pullRequests = rest;

                        return {
                            "value": pullRequest,
                            "done": false
                        };


                    }
                };
            }
        };


    }

    return { getPullRequestAsyncIterable };

}





