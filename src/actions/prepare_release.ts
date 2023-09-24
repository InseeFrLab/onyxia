import { setOutputFactory } from "../outputHelper";
import { getActionParamsFactory } from "../inputHelper";
import { SemVer } from "../tools/SemVer";
import { createOctokit } from "../tools/createOctokit";
import { getLatestSemVersionedTagFactory } from "../tools/octokit-addons/getLatestSemVersionedTag";
import * as fs from "fs";
import { join as pathJoin } from "path";
import { assert } from "tsafe/assert";
import YAML from "yaml";
import { computeDirectoryDigest } from "../tools/computeDirectoryDigest";
import { githubCommit } from "../tools/githubCommit";
import { Deferred } from "evt/tools/Deferred";
import { createLoggedExec } from "../tools/exec";
import { id } from "tsafe/id";
import { exec } from "../tools/exec";

const helmChartDirBasename = "helm-chart";

const { getActionParams } = getActionParamsFactory({
    "inputNameSubset": [
        "owner",
        "repo",
        "sha",
        "github_token",
        "automatic_commit_author_email",
        "is_external_pr",
        "is_default_branch",
        "is_bot"
    ] as const
});

type Params = ReturnType<typeof getActionParams>;

const { setOutput } = setOutputFactory<
    | "new_chart_version"
    | "new_web_docker_image_tags"
    | "release_target_git_commit_sha"
    | "release_message"
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
        is_external_pr,
        is_default_branch,
        recursiveCallParams,
        is_bot,
        log = () => { }
    } = params;

    log(JSON.stringify(params, null, 2));

    const repository = `${owner}/${repo}` as const;

    if (is_external_pr === "true" || is_bot === "true") {

        log("External PR or PR from a bot, skipping");

        return {
            "new_chart_version": "",
            "new_web_docker_image_tags": "",
            "release_message": "",
            "release_target_git_commit_sha": ""
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

        if( resp === undefined ){
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
        ].map(gitRef =>{

            //NOTE: Only for initialization.
            if( gitRef === undefined ){
                return id<Versions>({
                    "apiVersion": SemVer.parse("v0.30"),
                    "webVersion": SemVer.parse("2.29.4"),
                    "chartVersion": SemVer.parse("4.0.1"),
                    "chartDigest": ""
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

    if (is_default_branch === "false") {

        const branchName = await getShaBranchName({
            repository,
            github_token,
            sha,
            log
        });

        const new_web_docker_image_tags = `${webDockerhubRepository}:${branchName}`.toLowerCase();

        log([
            "We are not on the default branch, not releasing.",
            `Pushing docker image: ${new_web_docker_image_tags}`
        ].join(" "));


        return {
            "new_chart_version": "",
            "release_message": "",
            "release_target_git_commit_sha": sha,
            new_web_docker_image_tags
        };
    }

    const targetChartVersion = determineTargetChartVersion({
        previousReleaseVersions,
        currentVersions
    });

    if (SemVer.compare(targetChartVersion, previousReleaseVersions.chartVersion) === 0) {

        log("No need to release");

        return {
            "new_chart_version": "",
            "release_message": "",
            "release_target_git_commit_sha": "",
            "new_web_docker_image_tags": ""
        };

    }


    log(`Upgrading chart version to: ${SemVer.stringify(targetChartVersion)}`);

    const { sha: release_target_git_commit_sha } = await githubCommit({
        "commitAuthorEmail": automatic_commit_author_email,
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

                readmeText =
                    readmeText.replace(
                        /(https:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/)([^\/]+)(\/README\.md#configuration)/g,
                        (...[, p1, , p3]) => `${p1}${currentVersions.apiVersion.parsedFrom}${p3}`
                    );

                readmeText =
                    readmeText.replace(
                        /(https:\/\/github\.com\/[\/]+\/[\/]+\/blob\/)([^\/]+)(\/\.env)/g,
                        (...[, p1, , p3]) => `${p1}v${SemVer.stringify(targetChartVersion)}${p3}`
                    );

                readmeText =
                    readmeText.replace(
                        /(https:\/\/github\.com\/[\/]+\/[\/]+\/blob\/)([^\/]+)(\/src\/core\/ports\/OnyxiaApi\/XOnyxia\.ts)/g,
                        (...[, p1, , p3]) => `${p1}v${SemVer.stringify(targetChartVersion)}${p3}`
                    );

                readmeText =
                    readmeText.replace(
                        /--version "?[^ "]+"?/g,
                        `--version "${SemVer.stringify(targetChartVersion)}"`
                    );

                fs.writeFileSync(
                    readmeFilePath,
                    Buffer.from(readmeText, "utf8")
                );

            }

            return {
                "message": `Automatic ${SemVer.bumpType({
                    "versionBehind": previousReleaseVersions.chartVersion,
                    "versionAhead": targetChartVersion
                })} bump of chart version to ${SemVer.stringify(targetChartVersion)}`,
                "doAddAll": false,
                "doCommit": true
            };
        }
    });


    return {
        "new_chart_version": SemVer.stringify(targetChartVersion),
        "new_web_docker_image_tags": [SemVer.stringify(currentVersions.webVersion), "latest"].map(tag => `${webDockerhubRepository.toLowerCase()}:${tag}`).join(","),
        "release_target_git_commit_sha": release_target_git_commit_sha ?? sha,
        "release_message": generateReleaseMessageBody({
            "helmChartVersion": SemVer.stringify(targetChartVersion),
            "helmChartVersion_previous": SemVer.stringify(previousReleaseVersions.chartVersion),
            "onyxiaApiVersion": SemVer.stringify(currentVersions.apiVersion),
            "onyxiaApiVersion_previous": SemVer.stringify(previousReleaseVersions.apiVersion),
            "webVersion": SemVer.stringify(currentVersions.webVersion),
            "webVersion_previous": SemVer.stringify(previousReleaseVersions.webVersion),
        })
    };

}

export async function run() {

    const params = getActionParams();

    const outputs = await _run({
        ...params,
        "log": console.log.bind(console)
    });

    setOutput(outputs);

}

type Versions = {
    chartVersion: SemVer;
    apiVersion: SemVer;
    webVersion: SemVer;
    chartDigest: string;
};


function readVersions(
    params: {
        repository: `${string}/${string}`
        gitRef: string;
        githubToken: string;
        log?: (message: string) => void;
    }
): Promise<Versions> {

    const { repository, gitRef, githubToken, log =()=> {} } = params;

    const dVersions = new Deferred<Versions>();

    githubCommit({
        log,
        "ref": gitRef,
        repository,
        "token": githubToken,
        "action": async ({ repoPath }) => {

            dVersions.resolve({
                "webVersion": (() => {

                    const value = JSON.parse(
                        fs.readFileSync(pathJoin(repoPath, "package.json"))
                            .toString("utf8")
                    )["version"];

                    assert(typeof value === "string");

                    return SemVer.parse(value);

                })(),
                "chartVersion": (() => {

                    const value = YAML.parse(
                        fs.readFileSync(pathJoin(repoPath, helmChartDirBasename, "Chart.yaml"))
                            .toString("utf8")
                    )["version"];

                    assert(typeof value === "string");

                    return SemVer.parse(value);

                })(),
                "chartDigest": computeDirectoryDigest({ "dirPath": pathJoin(repoPath, helmChartDirBasename) }),
                "apiVersion": await (async () => {

                    const { exec } = createLoggedExec({ log });

                    const apiSubmoduleDirPath = pathJoin(repoPath, "api");

                    await exec("git submodule update --init --recursive", { "cwd": repoPath });

                    await exec("git fetch --tags", { "cwd": apiSubmoduleDirPath });

                    await exec("git rev-parse HEAD", { "cwd": apiSubmoduleDirPath });

                    const output = await exec("git tag --contains HEAD", { "cwd": apiSubmoduleDirPath });

                    return SemVer.parse(output.trim());

                })()
            });

            return { "doCommit": false };

        }
    }).catch(error => dVersions.reject(error));

    return dVersions.pr;

}

function determineTargetChartVersion(
    params: {
        previousReleaseVersions: Versions,
        currentVersions: Versions
    }
): SemVer {

    const {
        previousReleaseVersions,
        currentVersions
    } = params;

    const getWeightFromBumpType = (bumpType: SemVer.BumpType): number => {
        assert(bumpType !== "rc");
        switch (bumpType) {
            case "no bump": return 0;
            case "patch": return 1;
            case "minor": return 2;
            case "major": return 3;
        }
    };

    const getBumpTypeFromWeight = (weight: number): Exclude<SemVer.BumpType, "rc"> => {
        switch (weight) {
            case 0: return "no bump";
            case 1: return "patch";
            case 2: return "minor";
            case 3: return "major";
        }
        assert(false);
    }

    const minimumBumpType = getBumpTypeFromWeight(
        Math.max(
            getWeightFromBumpType(
                SemVer.bumpType({
                    "versionBehind": previousReleaseVersions.apiVersion,
                    "versionAhead": currentVersions.apiVersion
                })
            ),
            getWeightFromBumpType(
                SemVer.bumpType({
                    "versionBehind": previousReleaseVersions.webVersion,
                    "versionAhead": currentVersions.webVersion
                })
            )
        )
    );

    const chartBumpType =
        SemVer.bumpType({
            "versionBehind": previousReleaseVersions.chartVersion,
            "versionAhead": currentVersions.chartVersion
        });

    let targetChartVersion = { ...currentVersions.chartVersion };

    switch (minimumBumpType) {
        case "no bump": {

            if (chartBumpType === "no bump" && previousReleaseVersions.chartDigest !== currentVersions.chartDigest) {
                targetChartVersion.patch++;
            }

            return targetChartVersion;

        };
        case "patch": {

            if (chartBumpType === "no bump") {
                targetChartVersion.patch++;
            }

            return targetChartVersion;


        }
        case "minor": {

            if (chartBumpType === "no bump" || chartBumpType === "patch") {
                targetChartVersion = { ...previousReleaseVersions.chartVersion };
                targetChartVersion.minor++;
                targetChartVersion.patch = 0;
            }

            return targetChartVersion;

        }
        case "major": {

            if (chartBumpType === "no bump" || chartBumpType === "patch" || chartBumpType === "minor") {
                targetChartVersion = { ...previousReleaseVersions.chartVersion };
                targetChartVersion.major++;
                targetChartVersion.minor = 0;
                targetChartVersion.patch = 0;
            }

            return targetChartVersion;

        }

    }

}



/** ChatGPT generated */
function generateReleaseMessageBody(params: {
    helmChartVersion_previous: string;
    helmChartVersion: string;
    webVersion_previous: string;
    webVersion: string;
    onyxiaApiVersion_previous: string;
    onyxiaApiVersion: string;
}): string {

    const {
        helmChartVersion,
        helmChartVersion_previous,
        onyxiaApiVersion_previous,
        onyxiaApiVersion,
        webVersion,
        webVersion_previous
    } = params;

    const helmChartVersionBumpType = SemVer.bumpType({
        "versionBehind": SemVer.parse(helmChartVersion_previous),
        "versionAhead": SemVer.parse(helmChartVersion)
    });
    const webVersionBumpType = SemVer.bumpType({
        "versionBehind": SemVer.parse(webVersion_previous),
        "versionAhead": SemVer.parse(webVersion)
    });
    const onyxiaApi_VersionBumpType = SemVer.bumpType({
        "versionBehind": SemVer.parse(onyxiaApiVersion_previous),
        "versionAhead": SemVer.parse(onyxiaApiVersion)
    });

    let message = `# Release Notes \n\n`;

    message += `## Helm Chart Version :package: \n`;
    message += `- Previous: \`${helmChartVersion_previous}\` \n`;
    message += `- New: \`${helmChartVersion}\` \n\n`;

    switch (helmChartVersionBumpType) {
        case 'patch':
            message += `:adhesive_bandage: No API changes. You can upgrade without fear of breaking your install. \n\n`;
            break;
        case 'minor':
            message += `:new: New parameters are available in the configuration. No breaking changes with the previous release. [Documentation](https://github.com/InseeFrLab/onyxia/tree/main/helm-chart) \n\n`;
            break;
        case 'major':
            message += `:warning: Upgrading might break your Onyxia install. Please refer to the [new documentation](https://github.com/InseeFrLab/onyxia/tree/main/helm-chart). \n\n`;
            break;
    }

    if (webVersionBumpType !== 'no bump') {
        message += `## Onyxia Web :globe_with_meridians: \n`;
        message += `- Previous: \`${webVersion_previous}\` \n`;
        message += `- New: \`${webVersion}\` \n\n`;

        switch (webVersionBumpType) {
            case 'patch':
                message += `:adhesive_bandage: No API changes. You can upgrade without fear of breaking your install. \n\n`;
                break;
            case 'minor':
                message += `:new: New parameters are available in the configuration. No breaking changes with the previous release. [Documentation](https://github.com/InseeFrLab/onyxia/tree/main/helm-chart) \n\n`;
                break;
            case 'major':
                message += `:warning: Upgrading might break your Onyxia install. Please refer to the [new documentation](https://github.com/InseeFrLab/onyxia/tree/main/helm-chart). \n\n`;
                break;
        }
    }

    if (onyxiaApi_VersionBumpType !== 'no bump') {
        message += `## Onyxia API :gear: \n`;
        message += `- Previous: \`${onyxiaApiVersion_previous}\` \n`;
        message += `- New: \`${onyxiaApiVersion}\` \n\n`;

        switch (onyxiaApi_VersionBumpType) {
            case 'patch':
                message += `:adhesive_bandage: No API changes. You can upgrade without fear of breaking your install. \n\n`;
                break;
            case 'minor':
                message += `:new: New parameters are available in the configuration. No breaking changes with the previous release. [Documentation](https://github.com/InseeFrLab/onyxia/tree/main/helm-chart) \n\n`;
                break;
            case 'major':
                message += `:warning: Upgrading might break your Onyxia install. Please refer to the [new documentation](https://github.com/InseeFrLab/onyxia/tree/main/helm-chart). \n\n`;
                break;
        }
    }

    return message;
}

function getWebDockerhubRepository(
    params: {
        repository: `${string}/${string}`;
        github_token: string;
        sha: string;
    }
) {

    const { repository, github_token, sha } = params;

    const dOut = new Deferred<string>();

    githubCommit({
        repository,
        "token": github_token,
        "ref": sha,
        "action": async ({ repoPath }) => {

            dOut.resolve(
                YAML.parse(
                    fs.readFileSync(
                        pathJoin(repoPath, helmChartDirBasename, "values.yaml")
                    ).toString("utf8")
                )["web"]["image"]["repository"]
            );

            return { "doCommit": false };
        }

    });

    return dOut.pr;

}

function getShaBranchName(
    params: {
        repository: `${string}/${string}`;
        github_token: string;
        sha: string;
        log: (message: string) => void;
    }
) {

    const { repository, github_token, sha, log } = params;

    const dOut = new Deferred<string>();

    githubCommit({
        repository,
        "token": github_token,
        "ref": sha,
        "action": async ({ repoPath }) => {

            await exec("git fetch origin", { "cwd": repoPath });

            const output = (await exec(`git for-each-ref --contains ${sha} refs/heads/`, { "cwd": repoPath })).trim();

            log(`===========>${output}`);


            const split = output.split("refs/remotes/origin/");

            log(`===========>${JSON.stringify(split)}`);

            assert(split.length === 2, "Something went wrong trying to get the branch name");

            dOut.resolve(split[1]);

            return { "doCommit": false };
        }

    });

    return dOut.pr;

}
