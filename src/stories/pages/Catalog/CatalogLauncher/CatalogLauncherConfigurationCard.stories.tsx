import { useState, useMemo } from "react";
import { CatalogLauncherConfigurationCard, Props } from "app/components/pages/Catalog/CatalogLauncher/CatalogLauncherConfigurationCard";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { css } from "tss-react";
import { same } from "evt/tools/inDepth/same";
import { useConstCallback } from "powerhooks";

function Container(props: Omit<Props, "formFieldsByTabName" | "onFormValueChange">) {

    const [formFields, setFormFields] = useState<Props["formFieldsByTabName"][string]["formFields"]>([
        {
            "path": ["resources", "cpu"],
            "title": "cpu",
            "isReadonly": false,
            "description": "The amount of cpu guaranteed",
            "value": "0.1"
        },{
            "path": ["resources", "memory"],
            "title": "memory",
            "isReadonly": false,
            "description": "The amount of memory guaranteed",
            "value": "512Mi"
        },{
            "path": ["resources", "memory2"],
            "title": "memory2",
            "isReadonly": false,
            "description": "The amount of memory guaranteed",
            "value": "512Mi"
        }, {
            "path": ["environnement", "s3"],
            "title": "s3",
            "isReadonly": false, 
            "description": "Add S3 temporary identity inside your environment",
            "value": true
        },
        {
            "path": ["environnement", "vault"],
            "title": "vault",
            "isReadonly": false, 
            "description": "Add vault temporary identity inside your environment",
            "value": true
        },
        {
            "path": ["environnement", "git"],
            "title": "git",
            "isReadonly": false, 
            "description": "Add git config inside your environment",
            "value": true
        },
        {
            "path": ["environnement", "git2"],
            "title": "git",
            "isReadonly": false, 
            "description": "Add git config inside your environment",
            "value": true
        },
        {
            "path": ["environnement", "git3"],
            "title": "git",
            "isReadonly": false, 
            "description": "Add git config inside your environment",
            "value": true
        },
        {
            "path": ["r", "version"],
            "title": "version",
            "isReadonly": false,
            "description": "r version",
            "value": "inseefrlab/rstudio:3.6.3",
            "enum": [ 
                "inseefrlab/rstudio:3.6.3", 
                "inseefrlab/rstudio:4.0.4", 
                "inseefrlab/utilitr:0.7.0"
            ]
        }
    ]);

    const formFieldsByTabName = useMemo(
        () => {

            const out: Props["formFieldsByTabName"] = {};

            formFields.forEach(
                formField =>
                    //(out[formField.path[0]] ??= []).push(formField)
                    (out[formField.path[0]] ?? (out[formField.path[0]] = { "formFields": [], "description": "tab description"}))
                    .formFields.push(formField)

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
            formFieldsByTabName={formFieldsByTabName}
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
    "isDependency": true,
    "dependencyNamePackageNameOrGlobal": "rstudio"
});