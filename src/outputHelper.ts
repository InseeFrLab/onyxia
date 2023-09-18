
import * as core from '@actions/core'
import { objectKeys } from "tsafe/objectKeys";

export const outputNames = [
    "do_need_release",
    "release_target_git_commit_sha",
    "chart_version",
    "web_version",
    "release_message"
] as const;

export function getOutputDescription(inputName: typeof outputNames[number]): string {
    switch (inputName) {
        case "do_need_release": return "Output of assess_release_criteria, true|false";
        case "release_target_git_commit_sha": return [
            "Output of assess_release_criteria, string, Example: 1a2b3...",
            "If a release is needed this action might push new commits, this output",
            "is the sha of the commit that should be released."
        ].join(" ");
        case "chart_version": return "Output of assess_release_criteria, string, Example 1.2.3";
        case "web_version": return "Output of assess_release_criteria, string, Example 1.2.3, 'null' if no need for release";
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