
import * as core from '@actions/core';
import { assert, type Equals } from "tsafe/assert";
import type { ActionName } from "./actions";

export const inputNames = [
    "action_name",
    "github_token",
    "owner",
    "repo",
    "sha",
    "commit_author_email"
] as const;

export function getInputDescription(inputName: typeof inputNames[number]): string {
    switch (inputName) {
        case "action_name": return [
            `Action to run, one of: `,
            (() => {

                //NOTE: We don't import directly to avoid circular dependency
                const actionNames = [
                    "assess_release_criteria"
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
            "Should not be provided, the good default will be used",
            "github.sha"
        ].join(" ")
        case "commit_author_email": return [
            "In actions that perform a git commit, the email of the author of the commit.",
            "Default to actions@github.com"
        ].join(" ");
    }
}


export function getInputDefault(inputName: typeof inputNames[number]): string | undefined {
    switch (inputName) {
        case "owner": return "${{github.repository_owner}}";
        case "repo": return "${{github.event.repository.name}}";
        case "github_token": return "${{ github.token }}";
        case "sha": return "${{ github.sha }}";
        case "commit_author_email": return "actions@github.com";
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
