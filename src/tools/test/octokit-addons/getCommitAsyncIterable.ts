
import { getCommitAsyncIterableFactory } from "../../octokit-addons/getCommitAsyncIterable";
import { createOctokit } from "../../createOctokit";


(async function () {

    const octokit = createOctokit({ "github_token": "" });

    const { getCommitAsyncIterable } = getCommitAsyncIterableFactory({ octokit });

    const commitAsyncIterable = getCommitAsyncIterable({
        "owner": "garronej",
        "repo": "test-repo",
        "branch": "master"
    });

    for await (const commit of commitAsyncIterable) {
        console.log(commit.commit.message);
    }

    console.log("done");

})();




