
import * as realCore from "@actions/core";
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

type CoreLike = {
    debug: (message: string) => void;
};


export async function run(
    params: {
        actionParams: Params,
        core: CoreLike
    }
): Promise<void> {

    const { actionParams, core } = params;


    return null as any;

}

export async function runProduction() {

    const actionParams = getActionParams();

    await run({ actionParams, "core": realCore });


}