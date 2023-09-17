
import { getCommitAheadFactory } from "../../octokit-addons/getCommitAhead";
import { Octokit } from "@octokit/rest";

(async ()=>{

    const octokit = new Octokit();

    const { getCommitAhead } = getCommitAheadFactory({ octokit });

    const { commits } = await getCommitAhead({
        "owner": "garronej",
        "repo": "test-repo",
        "branchBehind": "garronej-patch-1",
        "branchAhead": "master"
    });

    const messages = commits.map(({ commit })=> commit.message );

    console.log(JSON.stringify(messages, null, 2));

})();