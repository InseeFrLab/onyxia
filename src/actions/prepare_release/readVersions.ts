
import { SemVer } from "../../tools/SemVer";
import * as fs from "fs";
import { join as pathJoin } from "path";
import { assert } from "tsafe/assert";
import YAML from "yaml";
import { gitClone } from "../../tools/gitClone";
import { Deferred } from "evt/tools/Deferred";
import { createLoggedExec } from "../../tools/exec";
import { helmChartDirBasename } from "../release_helm_chart";

export type Versions = {
    chartVersion: SemVer;
    apiVersion: SemVer;
    webVersion: SemVer;
};


export function readVersions(
    params: {
        repository: `${string}/${string}`
        gitRef: string;
        githubToken: string;
        log?: (message: string) => void;
    }
): Promise<Versions> {

    const { repository, gitRef, githubToken, log = () => { } } = params;

    const dVersions = new Deferred<Versions>();

    gitClone({
        log,
        "ref": gitRef,
        repository,
        "token": githubToken,
        "action": async ({ repoPath }) => {

            dVersions.resolve({
                "webVersion": (() => {

                    const value = JSON.parse(
                        fs.readFileSync(pathJoin(repoPath, "web", "package.json"))
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
                "apiVersion": await (async () => {

                    const { exec } = createLoggedExec({ log });

                    const apiSubmoduleDirPath = pathJoin(repoPath, "api");

                    await exec("git submodule update --init --recursive", { "cwd": repoPath });

                    await exec("git fetch --tags", { "cwd": apiSubmoduleDirPath });

                    //await exec("git rev-parse HEAD", { "cwd": apiSubmoduleDirPath });

                    log("before git tag --contains HEAD");

                    const output = await exec("git tag --contains HEAD", { "cwd": apiSubmoduleDirPath });

                    log(`========>${output}<========`);
                    log(`trimed========>${output.trim()}<========`);

                    const out=  SemVer.parse(output.trim());

                    log("sucessfully parsed");

                    return out;

                })()
            });

            return { "doCommit": false };

        }
    }).catch(error => dVersions.reject(error));

    return dVersions.pr;

}