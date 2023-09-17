
import { getCommonOriginFactory } from "../../octokit-addons/getCommonOrigin";
import { Octokit } from "@octokit/rest";


(async function () {

    const octokit = new Octokit();

    const { getCommonOrigin } = getCommonOriginFactory({ octokit });

    const { sha } = await getCommonOrigin({
        "owner": "garronej",
        "repo": "test-repo",
        "branch1": "master",
        "branch2": "garronej-patch-1"
    });

    console.log({ sha });

})();


