
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
    "github_pages_branch_name",
    "web_dockerhub_repository",
    "is_external_pr",
    "is_default_branch",
    "is_bot"
] as const;

export function getInputDescription(inputName: typeof inputNames[number]): string {
    switch (inputName) {
        case "action_name": return [
            `Action to run, one of: `,
            (() => {

                //NOTE: We don't import directly to avoid circular dependency
                const actionNames = [
                    "assess_release_criteria",
                    "release_helm_chart"
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
        case "github_pages_branch_name": return [
            "Github page branch name for the repository, example: 'gh-pages'",
            "no default provided, required for 'release_helm_chart' action",
            "If the branch does not exist it will be created"
        ].join(" ");
        case "web_dockerhub_repository": return [
            "Dockerhub repository name, example: 'inseefrlab/onyxia-web'",
            "for actions that need to create tags."
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
    }
}


export function getInputDefault(inputName: typeof inputNames[number]): string | undefined {
    switch (inputName) {
        case "owner": return "${{github.repository_owner}}";
        case "repo": return "${{github.event.repository.name}}";
        case "github_token": return "${{ github.token }}";
        case "sha": return "${{ github.sha }}";
        case "automatic_commit_author_email": return "actions@github.com";
        case "is_external_pr": 
            return "${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name != github.repository }}";
        case "is_default_branch": return "${{ github.event_name == 'push' && github.event.ref == format('refs/heads/{0}', github.event.repository.default_branch) }}";
        case "is_bot": return "${{ github.actor.endsWith('[bot]') }}";
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
