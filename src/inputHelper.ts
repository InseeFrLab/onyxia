
import * as core from '@actions/core';
import { assert, type Equals } from "tsafe/assert";
import type { ActionName } from "./actions";

export const inputNames = [
    "action_name",
    "github_token",
    "owner",
    "repo",
    "sha",
    "automatic_commit_author_email",
    "is_external_pr",
    "is_default_branch",
    "is_bot",
    "sub_directory",
    "tag_name"
] as const;

export function getInputDescription(inputName: typeof inputNames[number]): string {
    switch (inputName) {
        case "action_name": return [
            `Action to run, one of: `,
            (() => {

                //NOTE: We don't import directly to avoid circular dependency
                const actionNames = [
                    "prepare_release",
                    "release_helm_chart",
                    "checkout",
                    "create_tag"
                ] as const;

                assert<Equals<typeof actionNames[number], ActionName>>(true);

                return actionNames;

            })().map(s => `"${s}"`).join(", ")
        ].join("");
        case "owner": return [
            "Repository owner, example: 'garronej',",
            "github.repository_owner"
        ].join("");
        case "repo": return [
            "Repository name, example: ",
            "'evt', github.event.repository.name"
        ].join("");
        case "github_token": return [
            "GitHub Personal access token",
            "One with no write access is provided by default"
        ].join("");
        case "sha": return [
            "If not provided, the good default will be used",
            "github.sha"
        ].join(" ")
        case "automatic_commit_author_email": return [
            "In actions that perform a git commit, the email of the author of the commit.",
            "Default to actions@github.com"
        ].join(" ");
        case "is_external_pr": return [
            "Tell if the sha correspond to a commit from a forked repository",
            "Do not provide this parameter explicitly, it will be set automatically"
        ].join(" ");
        case "is_default_branch": return [
            "Tell if the sha correspond to a commit from the default branch",
            "Do not provide this parameter explicitly, it will be set automatically"
        ].join(" ");
        case "is_bot": return [
            "Tell if the sha correspond to a commit from a bot",
            "Do not provide this parameter explicitly, it will be set automatically"
        ].join(" ");
        case "sub_directory": return [
            "For the 'checkout' action, tell what sub directory to checkout from the repo.",
            "Mandatory (else use the 'actions/checkout@v3' action directly). Example: 'web'"
        ].join(" ");
        case "tag_name": return [
            "For the 'create_tag' action, the name of the tag to create."
        ].join(" ");
    }
}


export function getInputDefault(inputName: typeof inputNames[number]): string | undefined {
    switch (inputName) {
        case "owner": return "${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.owner.login || github.repository_owner }}";
        case "repo": return "${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.name || github.event.repository.name }}";
        case "github_token": return "${{ github.token }}";
        case "sha": return "${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}";
        case "automatic_commit_author_email": return "actions@github.com";
        case "is_external_pr": 
            return "${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name != github.repository }}";
        case "is_default_branch": return "${{ github.event_name == 'push' && github.event.ref == format('refs/heads/{0}', github.event.repository.default_branch) }}";
        case "is_bot": return "${{ endsWith(github.actor, '[bot]') }}";
    }
}


const getInput = (inputName: typeof inputNames[number]) => {

    if (inputNames.indexOf(inputName) < 0) {
        throw new Error(`${inputName} expected`);
    }

    return core.getInput(inputName);

}


export function getActionParamsFactory<U extends typeof inputNames[number]>(
    params: {
        inputNameSubset: readonly U[]
    }
) {

    const { inputNameSubset } = params;

    function getActionParams() {

        const params: Record<U, string> = {} as any;

        inputNameSubset.forEach(inputName => params[inputName] = getInput(inputName));

        return params;

    };

    return { getActionParams };

}

export function getActionName(): ActionName {
    return getInput("action_name") as any;
}
