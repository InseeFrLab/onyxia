import { useState, useMemo } from "react";
import {
    CatalogLauncherConfigurationCard,
    CatalogLauncherConfigurationCardProps,
} from "ui/components/pages/Catalog/CatalogLauncher/CatalogLauncherConfigurationCard";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";
import { same } from "evt/tools/inDepth/same";
import { useConstCallback } from "powerhooks/useConstCallback";

function Container(
    props: Omit<
        CatalogLauncherConfigurationCardProps,
        "formFieldsByTabName" | "onFormValueChange"
    >,
) {
    const [formFields, setFormFields] = useState<
        CatalogLauncherConfigurationCardProps["formFieldsByTabName"][string]["formFields"]
    >([
        {
            "type": "text",
            "path": ["resources", "cpu"],
            "title": "cpu",
            "isReadonly": false,
            "description": "The amount of cpu guaranteed",
            "pattern": undefined,
            "value": "0.1",
            "defaultValue": "0.1",
            "doRenderAsTextArea": false,
        },
        {
            "type": "text",
            "path": ["resources", "memory"],
            "title": "memory",
            "isReadonly": false,
            "description": "The amount of memory guaranteed",
            "pattern": undefined,
            "value": "512Mi",
            "defaultValue": "512Mi",
            "doRenderAsTextArea": false,
        },
        {
            "type": "text",
            "path": ["resources", "memory2"],
            "title": "memory2",
            "isReadonly": false,
            "description": "The amount of memory guaranteed",
            "pattern": undefined,
            "value": "512Mi",
            "defaultValue": "512Mi",
            "doRenderAsTextArea": false,
        },
        {
            "type": "boolean",
            "path": ["environnement", "s3"],
            "title": "s3",
            "isReadonly": false,
            "description": "Add S3 temporary identity inside your environment",
            "value": true,
        },
        {
            "type": "boolean",
            "path": ["environnement", "vault"],
            "title": "vault",
            "isReadonly": false,
            "description": "Add vault temporary identity inside your environment",
            "value": true,
        },
        {
            "type": "boolean",
            "path": ["environnement", "git"],
            "title": "git",
            "isReadonly": false,
            "description": "Add git config inside your environment",
            "value": true,
        },
        {
            "type": "boolean",
            "path": ["environnement", "git2"],
            "title": "git",
            "isReadonly": false,
            "description": "Add git config inside your environment",
            "value": true,
        },
        {
            "type": "boolean",
            "path": ["environnement", "git3"],
            "title": "git",
            "isReadonly": false,
            "description": "Add git config inside your environment",
            "value": true,
        },
        {
            "type": "enum",
            "path": ["r", "version"],
            "title": "version",
            "isReadonly": false,
            "description": "r version",
            "value": "inseefrlab/rstudio:3.6.3",
            "enum": [
                "inseefrlab/rstudio:3.6.3",
                "inseefrlab/rstudio:4.0.4",
                "inseefrlab/utilitr:0.7.0",
            ],
        },
    ]);

    const formFieldsByTabName = useMemo(() => {
        const out: CatalogLauncherConfigurationCardProps["formFieldsByTabName"] = {};

        formFields.forEach(formField =>
            //(out[formField.path[0]] ??= []).push(formField)
            (
                out[formField.path[0]] ??
                (out[formField.path[0]] = {
                    "formFields": [],
                    "description": "tab description",
                    "assembledSliderRangeFormFields": [],
                })
            ).formFields.push(formField),
        );

        return out;
    }, [formFields]);

    const onFormValueChange = useConstCallback<
        CatalogLauncherConfigurationCardProps["onFormValueChange"]
    >(({ path, value }) =>
        setFormFields(
            formFields.map(formField => {
                if (same(formField.path, path)) {
                    formField.value = value;
                }
                return formField;
            }),
        ),
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
    "wrappedComponent": { "CatalogLauncherConfigurationCard": Container },
});

export default meta;

export const VueDefault = getStory({
    "meta": { "type": "dependency" },
    "dependencyNamePackageNameOrGlobal": "rstudio",
    "formFieldsIsWellFormed": [
        {
            "path": ["resources", "cpu"],
            "isWellFormed": true,
        },
        {
            "path": ["resources", "memory"],
            "isWellFormed": true,
        },
        {
            "path": ["resources", "memory2"],
            "isWellFormed": true,
        },
        {
            "path": ["environnement", "s3"],
            "isWellFormed": true,
        },
        {
            "path": ["environnement", "vault"],
            "isWellFormed": true,
        },
        {
            "path": ["environnement", "git"],
            "isWellFormed": true,
        },
        {
            "path": ["environnement", "git2"],
            "isWellFormed": true,
        },
        {
            "path": ["environnement", "git3"],
            "isWellFormed": true,
        },
        {
            "path": ["r", "version"],
            "isWellFormed": true,
        },
    ],
});
