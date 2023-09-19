
import * as core from '@actions/core'
import { objectKeys } from "tsafe/objectKeys";

export const outputNames = [
    "new_chart_version",
    "new_web_docker_image_tags",
    "release_target_git_commit_sha",
    "release_message"
] as const;

export function getOutputDescription(inputName: typeof outputNames[number]): string {
    switch (inputName) {
        case "new_chart_version": return "Output of assess_release_criteria, string, Example '1.2.3' or the empty string if no need for release";
        case "new_web_docker_image_tags": return [
            "Output of assess_release_criteria, string,",
            "Example 'inseefrlab/onyxia-web:2.30.0,inseefrlab/onyxia-web:latest' or the empty string",
            "if no need to push a Docker image to dockerhub"
        ].join(" ");
        case "release_target_git_commit_sha": return [
            "Output of assess_release_criteria, string, Example: 1a2b3...",
            "If a release is needed this action might push new commits, this output",
            "is the sha of the commit that should be released."
        ].join(" ");
        case "release_message": return "Output of assess_release_criteria, string";
    }
}

export function setOutputFactory<U extends typeof outputNames[number]>() {

    function setOutput(outputs: Record<U, string>): void {
        objectKeys(outputs)
            .forEach(outputName => core.setOutput(outputName, outputs[outputName]));
    };

    return { setOutput };

}