import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import type { FormField } from "../FormField";
import type { State } from "../state";

export function createGetIsFieldHidden(params: {
    formFields: FormField[];
    infosAboutWhenFieldsShouldBeHidden: State.Ready["infosAboutWhenFieldsShouldBeHidden"];
}) {
    const { formFields, infosAboutWhenFieldsShouldBeHidden } = params;

    function getIsFieldHidden(params: { path: string[] }) {
        const { path } = params;

        // TODO: Remove this block when the catalog will be updated
        {
            const onyxiaFriendlyNameFormFieldPath = "onyxia.friendlyName";
            const onyxiaIsSharedFormFieldPath = "onyxia.share";

            for (const onyxiaSpecialFormFieldPath of [
                onyxiaFriendlyNameFormFieldPath,
                onyxiaIsSharedFormFieldPath
            ]) {
                if (same(onyxiaSpecialFormFieldPath.split("."), path)) {
                    return true;
                }
            }
        }

        const infoAboutWhenFieldsShouldBeHidden = infosAboutWhenFieldsShouldBeHidden.find(
            ({ path: path_i }) => same(path, path_i)
        );

        if (infoAboutWhenFieldsShouldBeHidden === undefined) {
            return false;
        }

        const { isHidden } = infoAboutWhenFieldsShouldBeHidden;

        if (typeof isHidden === "boolean") {
            return isHidden;
        }

        const targetFormField = formFields.find(({ path }) => same(path, isHidden.path));

        assert(
            targetFormField !== undefined,
            [
                `We can't tell if ${path.join("/")} should be shown or hidden.`,
                "It is supposed to depend on the value of",
                isHidden.path.join("/"),
                "but this field doesn't exists in the chart."
            ].join(" ")
        );

        return targetFormField.value === isHidden.value;
    }

    return { getIsFieldHidden };
}
