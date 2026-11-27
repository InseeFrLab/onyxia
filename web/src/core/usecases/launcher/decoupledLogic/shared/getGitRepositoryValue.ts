import type { Stringifyable } from "core/tools/Stringifyable";
import type { FormField } from "../formTypes";

/**
 * The value of a render: "gitRepository" field, from the object in the helm values.
 * What isn't a string is read as empty, the other properties of the object are ignored.
 */
export function getGitRepositoryValue(
    value: Stringifyable | undefined
): FormField.GitRepository.Value {
    const getString = (key: string) => {
        if (!(value instanceof Object) || value instanceof Array) {
            return "";
        }

        const value_key = value[key];

        return typeof value_key === "string" ? value_key : "";
    };

    return {
        forgeId: getString("forgeId"),
        url: getString("url"),
        branch: getString("branch")
    };
}
