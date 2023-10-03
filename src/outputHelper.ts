
import * as core from '@actions/core'
import { objectKeys } from "tsafe/objectKeys";

export const outputNames = [
    "new_web_docker_image_tags",
    "new_chart_version",
    "release_name",
    "release_body",
    "release_tag_name",
    "target_commit",
    "web_tag_name"
] as const;

export function getOutputDescription(inputName: typeof outputNames[number]): string {
    switch (inputName) {
        case "new_chart_version": return "Output of prepare_release, string, Example '1.2.3' or the empty string if no need for release";
        case "new_web_docker_image_tags": return [
            "Output of prepare_release, string,",
            "Example 'inseefrlab/onyxia-web:2.30.0,inseefrlab/onyxia-web:latest' or the empty string",
            "if no need to push a Docker image to dockerhub"
        ].join(" ");
        case "release_name": return [
            "Output of prepare_release, string,",
            "To be used as parameter of the action of the softprops/action-gh-release action"
        ].join(" ");
        case "release_body": return [
            "Output of prepare_release, string,",
            "To be used as parameter of the action of the softprops/action-gh-release action"
        ].join(" ");
        case "release_tag_name": return [
            "Output of prepare_release, string,",
            "To be used as parameter of the action of the softprops/action-gh-release action"
        ].join(" ");
        case "target_commit": return [
            "Output of prepare_release, string,",
            "To be used as parameter of the action of the softprops/action-gh-release action",
            "and for checking out the right commit in the next actions because prepare_release",
            "creates a automatic commit"
        ].join(" ");
        case "web_tag_name": return [
            "Output of prepare_release, string,",
            "If the web tag has been bumped, the new tag name,",
            "else the empty string. This tag must be created additionally to the release tag"
        ].join(" ");
    }
}

export function setOutputFactory<U extends typeof outputNames[number]>() {

    function setOutput(outputs: Record<U, string>): void {
        objectKeys(outputs)
            .forEach(outputName => core.setOutput(outputName, outputs[outputName]));
    };

    return { setOutput };

}