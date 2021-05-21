import { useState, useMemo } from "react";
import { CatalogLauncherConfigurationCard, Props } from "app/components/pages/Catalog/CatalogLauncher/CatalogLauncherConfigurationCard";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { css } from "tss-react";
import { same } from "evt/tools/inDepth/same";
import { useConstCallback } from "powerhooks";

function Container(props: Omit<Props, "formFieldsByTab" | "onFormValueChange">) {

    const [formFields, setFormFields] = useState<Props["formFieldsByTab"][string]>([
        {
            "path": ["resources", "cpu"],
            "title": "cpu",
            "isReadonly": false,
            "description": "The amount of cpu guaranteed",
            "value": "0.1"
        },{
            "path": ["resources", "ram"],
            "title": "ram",
            "isReadonly": false,
            "description": "The amount of memory guaranteed",
            "value": "256Mi"
        }
    ]);

    const formFieldsByTab = useMemo(
        () => {

            const out: Props["formFieldsByTab"] = {};

            formFields.forEach(
                formField =>
                    //(out[formField.path[0]] ??= []).push(formField)
                    (out[formField.path[0]] ?? (out[formField.path[0]] = [])).push(formField)

            );

            return out;

        },
        [formFields]
    );

    const onFormValueChange = useConstCallback<Props["onFormValueChange"]>(
        ({ path, value }) =>
            setFormFields(
                formFields.map(formField => {
                    if (same(formField.path, path)) {
                        formField.value = value;
                    }
                    return formField;
                })
            )
    );

    return (
        <CatalogLauncherConfigurationCard
            formFieldsByTab={formFieldsByTab}
            onFormValueChange={onFormValueChange}
            {...props}
        />
    );


}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { "CatalogLauncherConfigurationCard": Container }
});

export default meta;

export const VueDefault = getStory({
    "className": css({ "width": 700 }),
});