
import fetch from "node-fetch";
import * as core from "@actions/core";
import { setOutputFactory } from "../outputHelper";
import { getActionParamsFactory } from "../inputHelper";
import { SemVer } from "../tools/SemVer";
import { createOctokit } from "../tools/createOctokit";
import { getLatestSemVersionedTagFactory } from "../tools/octokit-addons/getLatestSemVersionedTag";
import type { Param0 } from "tsafe";
import * as fs from "fs";
import { join as pathJoin } from "path";
import { assert } from "tsafe/assert";
import YAML from "yaml";
import { computeDirectoryDigest } from "../tools/computeDirectoryDigest";
import * as child_process from "child_process";
import { githubCommit } from "../tools/githubCommit";
import { Deferred } from "evt/tools/Deferred";
import { id } from "tsafe/id";

const { getActionParams } = getActionParamsFactory({
    "inputNameSubset": [
        "owner",
        "repo",
        "sha",
        "github_token",
        "commit_author_email",
        "dockerhub_repository"
    ] as const
});

type Params = ReturnType<typeof getActionParams>;

type CoreLike = {
    debug: (message: string) => void;
};

const { setOutput } = setOutputFactory<
    | "new_chart_version"
    | "new_web_docker_image_tags"
    | "release_target_git_commit_sha"
    | "release_message"
>();

export async function _run(
    params: Params & { log?: (message: string) => void; }
): Promise<Parameters<typeof setOutput>[0]> {

    const { github_token, owner, repo, sha, dockerhub_repository, commit_author_email, log = console.log.bind(console) } = params;

    const previousReleaseTag = await (async () => {

        const octokit = createOctokit({ github_token });

        const { getLatestSemVersionedTag } = getLatestSemVersionedTagFactory({ octokit });

        const resp = await getLatestSemVersionedTag({
            owner,
            repo
        });

        assert(resp !== undefined);

        if (SemVer.compare(resp.version, SemVer.parse("2.29.4")) <= 0) {
            // It's the first time we release, the previous release where from Onyxia web only
            return undefined;
        }

        return resp.tag;

    })();

    const [
        previousReleaseVersions,
        currentVersions
    ] = await Promise.all(
        [
            previousReleaseTag ?? sha,
            sha
        ].map(gitRef =>
            readVersions({
                gitRef,
                "githubToken": github_token,
                "repository": `${owner}/${repo}`
            }))
    );


    return null as any;

}

export async function run() {

    const params = getActionParams();

    const outputs = await _run({
        ...params,
        "log": core.debug.bind(core)
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
    }
): Promise<Versions> {

    const { repository, gitRef, githubToken } = params;

    const dVersions = new Deferred<Versions>();

    githubCommit({
        "ref": gitRef,
        repository,
        "token": githubToken,
        "action": async ({ repoPath }) => {

            const helmChartDirBasename = "helm-chart";

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
                "apiVersion": (() => {

                    const apiSubmoduleDirPath = pathJoin(repoPath, "api");

                    child_process.execSync("git submodule update --init --recursive", { "cwd": repoPath });

                    child_process.execFileSync("git fetch --tags", { "cwd": apiSubmoduleDirPath });
                    child_process.execFileSync("git rev-parse HEAD", { "cwd": apiSubmoduleDirPath });

                    const output = child_process.execFileSync("git tag --contains HEAD", { "cwd": apiSubmoduleDirPath });

                    return SemVer.parse(output.toString("utf8").trim());

                })()
            });

            return { "doCommit": false };

        }
    }).catch(error => dVersions.reject(error));

    return dVersions.pr;

}

function deduceTargetChartVersion(
    params: {
        previousReleaseVersions: Versions,
        currentVersions: Versions
    }
): SemVer {

    const {
        previousReleaseVersions,
        currentVersions
    }= params;


    const getWeight = (bumpType: ReturnType<typeof SemVer.bumpType>) => {
        assert(bumpType !== "rc");
        switch(bumpType){
            case "same": return 0;
            case "patch": return 1;
            case "minor": return 2;
            case "major": return 3;
        }
    };

    const requiredWeight = Math.max(
        getWeight(
        SemVer.bumpType({
            "versionBehindStr": previousReleaseVersions.apiVersion,
            "versionAheadStr": currentVersions.apiVersion
        })
        ),

    );

    return {
        "webVersion": currentVersions.webVersion,
        "apiVersion": currentVersions.apiVersion,
        "chartVersion": 



    };

}




