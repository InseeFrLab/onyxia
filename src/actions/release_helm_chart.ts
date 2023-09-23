
import * as core from "@actions/core";
import { getActionParamsFactory } from "../inputHelper";


const { getActionParams } = getActionParamsFactory({
    "inputNameSubset": [
        "owner",
        "repo",
        "sha",
        "github_token",
        "commit_author_email"
    ] as const
});

type Params = ReturnType<typeof getActionParams>;



export async function _run(
    params: Params & {
        log?: (message: string) => void;
    }
): Promise<void> {

    const {  log = ()=>{}  } = params;

    log("TODO!");

    return null as any;

}

export async function run() {

    const params = getActionParams();

    await _run({
        ...params,
        "log": core.debug.bind(core)
    });

}