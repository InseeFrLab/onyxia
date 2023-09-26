import { getActionParamsFactory } from "../inputHelper";
import { join as pathJoin } from "path";
import { githubCommit } from "../tools/githubCommit";
import { transformCodebase } from "../tools/transformCodebase";


const { getActionParams } = getActionParamsFactory({
    "inputNameSubset": [
        "owner",
        "repo",
        "sha",
        "github_token",
        "sub_directory"
    ] as const
});

type Params = ReturnType<typeof getActionParams>;


/** 
 * Will generate a onyxia-<version>.tgz file in the current working directory 
 * and update or create the index.yaml file in the gh-pages branch of the repository.
 * */
export async function _run(
    params: Params & {
        log?: (message: string) => void;
    }
): Promise<void> {

    const {
        github_token,
        owner,
        repo,
        sha,
        sub_directory,
        log = () => { }
    } = params;

    log(JSON.stringify(params, null, 2));

    await githubCommit({
        log,
        "repository": `${owner}/${repo}`,
        "ref": sha,
        "token": github_token,
        "action": async ({ repoPath }) => {

            transformCodebase({
                "srcDirPath": pathJoin(repoPath, sub_directory),
                "destDirPath": process.cwd(),
            });

            return { "doCommit": false };

        }
    });

}

export async function run() {

    const params = getActionParams();

    await _run({
        ...params,
        "log": console.log.bind(console)
    });

}
