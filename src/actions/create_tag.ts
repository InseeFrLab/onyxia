
import { getActionParamsFactory } from "../inputHelper";
import { gitClone } from "../tools/gitClone";
import { exec } from "../tools/exec";


const { getActionParams } = getActionParamsFactory({
    "inputNameSubset": [
        "owner",
        "repo",
        "sha",
        "github_token",
        "tag_name"
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
        tag_name,
        log = () => { }
    } = params;

    log(JSON.stringify(params, null, 2));

    await gitClone({
        log,
        "repository": `${owner}/${repo}`,
        "ref": sha,
        "token": github_token,
        "action": async ({ repoPath }) => {

            await exec(`git tag ${tag_name}`, { "cwd": repoPath });

            await exec(`git push origin ${tag_name}`, { "cwd": repoPath });

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
