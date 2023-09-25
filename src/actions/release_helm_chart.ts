import { getActionParamsFactory } from "../inputHelper";
import * as fs from "fs";
import { join as pathJoin } from "path";
import { assert } from "tsafe/assert";
import YAML from "yaml";
import { githubCommit } from "../tools/githubCommit";
import { exec } from "../tools/exec";
import fetch from "node-fetch";
import { installHelm } from "../tools/installHelm";

const helmChartDirBasename = "helm-chart";

const { getActionParams } = getActionParamsFactory({
    "inputNameSubset": [
        "owner",
        "repo",
        "sha",
        "github_token",
        "automatic_commit_author_email",
    ] as const
});

type Params = ReturnType<typeof getActionParams>;


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
        automatic_commit_author_email,
        log = () => { }
    } = params;

    log(JSON.stringify(params, null, 2));

    await installHelm();

    const repository = `${owner}/${repo}` as const;

    await githubCommit({
        log,
        repository,
        "ref": sha,
        "token": github_token,
        "action": async ({ repoPath }) => {

            const helmChartDir = pathJoin(repoPath, helmChartDirBasename);

            await exec(`helm lint ${helmChartDir}`);

            const outDirPath = pathJoin(helmChartDir, "_tmp_helm_output_dir");

            await fs.promises.mkdir(outDirPath);

            await exec(`helm package ${helmChartDir} -d ${outDirPath}`);

            const currentIndexYamlContent = await fetch(`https://${owner}.github.io/${repo}/index.yaml`).then(
                response => response.ok ?
                    response.text() :
                    undefined
            );

            const currentIndexYamlFilePath = pathJoin(outDirPath, "index.yaml");

            if( currentIndexYamlContent !== undefined ){

                fs.writeFileSync(
                    currentIndexYamlFilePath,
                    Buffer.from(currentIndexYamlContent, "utf8")
                );

            }

            const chartVersion = (() => {

                const value = YAML.parse(
                    fs.readFileSync(pathJoin(repoPath, helmChartDirBasename, "Chart.yaml"))
                        .toString("utf8")
                )["version"];

                assert(typeof value === "string");

                return value;

            })();

            await exec([
                `helm repo index`,
                outDirPath,
                currentIndexYamlContent == undefined ?
                    "":
                    `--merge ${currentIndexYamlFilePath}`,
                `--url https://${owner}.github.io/${repo}/releases/download/v${chartVersion}`,
            ].join(" "));

            {

                const basename = `onyxia-${chartVersion}.tgz`;

                fs.copyFileSync(
                    pathJoin(outDirPath, basename), 
                    pathJoin(process.cwd(), basename)
                );

            }

            await githubCommit({
                log,
                repository,
                "ref": "gh-pages",
                "token": github_token,
                "action": async ({ repoPath }) => {

                    const basename = "index.yaml";

                    fs.cpSync(pathJoin(outDirPath, basename), pathJoin(repoPath, basename));

                    return {
                        "doCommit": true,
                        "doAddAll": true,
                        "commitAuthorEmail": automatic_commit_author_email,
                        "message": `Update Helm Chart to v${chartVersion}`
                    };

                }
            });

            await fs.promises.rm(outDirPath, { "recursive": true, "force": true });

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
