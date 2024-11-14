import { setOutputFactory } from "../../outputHelper";
import { getActionParamsFactory } from "../../inputHelper";
import { SemVer } from "../../tools/SemVer";
import { createOctokit } from "../../tools/createOctokit";
import { getLatestSemVersionedTagFactory } from "../../tools/octokit-addons/getLatestSemVersionedTag";
import * as fs from "fs";
import { join as pathJoin } from "path";
import YAML from "yaml";
import { gitClone } from "../../tools/gitClone";
import { id } from "tsafe/id";
import { helmChartDirBasename } from "../release_helm_chart";
import { determineTargetChartVersion } from "./determineTargetChartVersion";
import { generateReleaseMessageBody, getWebTagName } from "./generateReleaseMessageBody";
import { getShaBranchName } from "../../tools/getShaBranchName";
import { getWebDockerhubRepository } from "./getWebDockerhubRepository";
import { updateChartReadme } from "./updateChartReadme";
import { readVersions, type Versions } from "./readVersions";
import { assert } from "tsafe/assert";

const { getActionParams } = getActionParamsFactory({
    "inputNameSubset": [
        "owner",
        "repo",
        "sha",
        "github_token",
        "automatic_commit_author_email",
        "is_pr",
        "is_external_pr",
        "is_bot",
        "branch_name"
    ] as const
});

type Params = ReturnType<typeof getActionParams>;

const { setOutput } = setOutputFactory<
    | "new_web_docker_image_tags"
    | "new_chart_version"
    | "release_name"
    | "release_body"
    | "release_tag_name"
    | "target_commit"
    | "web_tag_name"
>();

export async function _run(
    params: Params & {
        log?: (message: string) => void;
        /** Never provided, set automatically */
        recursiveCallParams?: {
            major: number;
        }
    }
): Promise<Parameters<typeof setOutput>[0]> {

    const {
        github_token,
        owner,
        repo,
        sha,
        automatic_commit_author_email,
        is_pr,
        is_external_pr,
        recursiveCallParams,
        is_bot,
        branch_name,
        log = () => { }
    } = params;

    log(JSON.stringify(params, null, 2));

    const repository = `${owner}/${repo}` as const;

    if (is_external_pr === "true" || (is_pr === "true" && is_bot === "true")) {

        log("External PR or PR from a bot, skipping");

        return {
            "new_web_docker_image_tags": "",
            "new_chart_version": "",
            "release_name": "",
            "release_body": "",
            "release_tag_name": "",
            "target_commit": "",
            "web_tag_name": ""
        };
    }

    const previousReleaseTag = await (async () => {

        const octokit = createOctokit({ github_token });

        const { getLatestSemVersionedTag } = getLatestSemVersionedTagFactory({ octokit });

        const resp = await getLatestSemVersionedTag({
            owner,
            repo,
            "major": recursiveCallParams?.major,
            "rcPolicy": "IGNORE RC"
        });

        if (resp === undefined) {
            return undefined;
        }

        if (SemVer.compare(resp.version, SemVer.parse("2.29.4")) <= 0) {
            // It's the first time we release, the previous release where from Onyxia web only
            return undefined;
        }

        return resp.tag;

    })();

    log(`Previous release tag: ${previousReleaseTag ?? "none"}`);

    const [
        previousReleaseVersions,
        currentVersions
    ] = await Promise.all(
        [
            previousReleaseTag,
            sha
        ].map(gitRef => {

            //NOTE: Only for initialization.
            if (gitRef === undefined) {
                return id<Versions>({
                    "apiVersion": SemVer.parse("v0.30"),
                    "webVersion": SemVer.parse("2.29.4"),
                    "chartVersion": SemVer.parse("4.1.0"),
                });
            }

            return readVersions({
                gitRef,
                "githubToken": github_token,
                repository,
                log
            });

        })
    );

    log(JSON.stringify({ previousReleaseVersions, currentVersions }, null, 2));

    if (previousReleaseVersions.chartVersion.major > currentVersions.chartVersion.major) {
        // We are providing a patch for a earlier major.

        log(`We are providing a patch for a earlier major, re-running fetching only previous releases of v${previousReleaseVersions.chartVersion.major}`);

        return _run({
            ...params,
            "recursiveCallParams": {
                "major": previousReleaseVersions.chartVersion.major
            }
        });
    }

    const webDockerhubRepository = await getWebDockerhubRepository({
        repository,
        github_token,
        sha
    });

    if (is_pr === "true") {

        const branchName = await getShaBranchName({
            repository,
            github_token,
            sha,
            log
        });

        const new_web_docker_image_tags = `${webDockerhubRepository}:${branchName.replace(/\/g/, "_")}`.toLowerCase();

        log([
            "We are not on the default branch, not releasing.",
            `Pushing docker image: ${new_web_docker_image_tags}`
        ].join(" "));


        return {
            new_web_docker_image_tags,
            "new_chart_version": "",
            "release_name": "",
            "release_body": "",
            "release_tag_name": "",
            "target_commit": sha,
            "web_tag_name": ""
        };
    }

    const targetChartVersion = determineTargetChartVersion({
        previousReleaseVersions,
        currentVersions
    });

    if (SemVer.compare(targetChartVersion, previousReleaseVersions.chartVersion) === 0) {

        log("No need to release");

        return {
            "new_web_docker_image_tags": "",
            "new_chart_version": "",
            "release_name": "",
            "release_body": "",
            "release_tag_name": "",
            "target_commit": "",
            "web_tag_name": ""
        };

    }

    log(`Upgrading chart version to: ${SemVer.stringify(targetChartVersion)}`);

    const { sha: target_commit } = await gitClone({
        "ref": sha,
        repository,
        "token": github_token,
        "action": async ({ repoPath }) => {

            {

                const chartFilePath = pathJoin(repoPath, helmChartDirBasename, "Chart.yaml");

                const chartParsed = YAML.parseDocument(
                    fs.readFileSync(chartFilePath)
                        .toString("utf8")
                );

                chartParsed.set("version", SemVer.stringify(targetChartVersion));

                fs.writeFileSync(
                    chartFilePath,
                    Buffer.from(YAML.stringify(chartParsed), "utf8")
                );

            }

            {

                const valuesFilePath = pathJoin(repoPath, helmChartDirBasename, "values.yaml");

                const valuesParsed = YAML.parseDocument(
                    fs.readFileSync(valuesFilePath)
                        .toString("utf8")
                );


                valuesParsed.setIn(["web", "image", "tag"], SemVer.stringify(currentVersions.webVersion));
                valuesParsed.setIn(["api", "image", "tag"], currentVersions.apiVersion.parsedFrom);

                fs.writeFileSync(
                    valuesFilePath,
                    Buffer.from(YAML.stringify(valuesParsed), "utf8")
                );

            }


            {

                const readmeFilePath = pathJoin(repoPath, helmChartDirBasename, "README.md");

                let readmeText = fs.readFileSync(readmeFilePath).toString("utf8");

                readmeText = updateChartReadme({ 
                    "apiVersionTag": currentVersions.apiVersion.parsedFrom,
                    "webVersionTag": getWebTagName(currentVersions.webVersion),
                    "releaseVersion": targetChartVersion,
                    readmeText 
                });

                fs.writeFileSync(
                    readmeFilePath,
                    Buffer.from(readmeText, "utf8")
                );

            }

            return {
                "doAddAll": false,
                "doCommit": true,
                "message": `Automatic ${SemVer.bumpType({
                    "versionBehind": previousReleaseVersions.chartVersion,
                    "versionAhead": targetChartVersion
                })} bump of chart version to ${SemVer.stringify(targetChartVersion)}`,
                "commitAuthorEmail": automatic_commit_author_email,
                "assertRefHeadOfBranchName": branch_name
            };
        }
    });

    // NOTE: We must have made a commit.
    assert(target_commit !== undefined);

    return {
        "new_chart_version": SemVer.stringify(targetChartVersion),
        "new_web_docker_image_tags":
            SemVer.compare(previousReleaseVersions.webVersion, currentVersions.webVersion) === 0 ?
                "" :
                [
                    SemVer.stringify(currentVersions.webVersion),
                    "latest"
                ].map(tag => `${webDockerhubRepository.toLowerCase()}:${tag}`).join(","),
        "release_name": `v${SemVer.stringify(targetChartVersion)}`,
        "release_tag_name": `v${SemVer.stringify(targetChartVersion)}`,
        "release_body": generateReleaseMessageBody({
            "chartVersions": {
                "previous": previousReleaseVersions.chartVersion,
                "new": targetChartVersion
            },
            "apiVersions": {
                "previous": previousReleaseVersions.apiVersion,
                "new": currentVersions.apiVersion
            },
            "webVersions": {
                "previous": previousReleaseVersions.webVersion,
                "new": currentVersions.webVersion
            },
        }),
        "target_commit": target_commit,
        "web_tag_name": SemVer.compare(previousReleaseVersions.webVersion, currentVersions.webVersion) === 0 ?
            "":
            getWebTagName(currentVersions.webVersion)
    };

}

export async function run() {

    const params = getActionParams();

    const outputs = await _run({
        ...params,
        "log": console.log.bind(console)
    });

    console.log(JSON.stringify(outputs, null, 2));

    setOutput(outputs);

}



