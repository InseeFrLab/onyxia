import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";
import type { FormField, IndexedFormFields } from "./FormField";

const { assembleFormFields } = (() => {
    const { assembleRangeSliderFormField } = (() => {
        const { assembleExtremities } = (() => {
            function toExtremities(
                formField: FormField.Slider.Range
            ): IndexedFormFields.AssembledSliderRangeFormField["extremities"][
                | "up"
                | "down"] {
                return {
                    "path": formField.path,
                    "semantic": formField.sliderExtremitySemantic,
                    "value": formField.value
                };
            }

            function assembleExtremities(
                formField1: FormField.Slider.Range,
                formField2: FormField.Slider.Range
            ): IndexedFormFields.AssembledSliderRangeFormField {
                const formFieldUp =
                    formField1.sliderExtremity === "up" ? formField1 : formField2;

                assert(formFieldUp.sliderExtremity === "up");

                const formFieldDown = [formField1, formField2].find(
                    formField => formField !== formFieldUp
                );

                assert(
                    formFieldDown !== undefined &&
                        formFieldDown.sliderExtremity === "down"
                );

                return {
                    "extremities": {
                        "down": toExtremities(formFieldDown),
                        "up": toExtremities(formFieldUp)
                    },
                    "sliderMax": formFieldUp.sliderMax,
                    ...formFieldDown
                };
            }

            return { assembleExtremities };
        })();

        function assembleRangeSliderFormField(
            acc: (
                | IndexedFormFields.AssembledSliderRangeFormField
                | FormField.Slider.Range
            )[],
            formField: FormField.Slider.Range
        ): void {
            const otherExtremity = acc
                .map(assembledSliderRangeFormFieldOrFormFieldSliderRange =>
                    "extremities" in assembledSliderRangeFormFieldOrFormFieldSliderRange
                        ? undefined
                        : assembledSliderRangeFormFieldOrFormFieldSliderRange
                )
                .filter(exclude(undefined))
                .find(({ sliderRangeId }) => sliderRangeId === formField.sliderRangeId);

            if (otherExtremity !== undefined) {
                acc[acc.indexOf(otherExtremity)] = assembleExtremities(
                    otherExtremity,
                    formField
                );
            } else {
                acc.push(formField);
            }
        }

        return { assembleRangeSliderFormField };
    })();

    function assembleFormFields(
        formFields: FormField.Slider.Range[]
    ): IndexedFormFields.AssembledSliderRangeFormField[] {
        let acc: (
            | IndexedFormFields.AssembledSliderRangeFormField
            | FormField.Slider.Range
        )[] = [];

        formFields.forEach(formField => assembleRangeSliderFormField(acc, formField));

        return acc.map(assembledSliderRangeFormField => {
            if (!("extremities" in assembledSliderRangeFormField)) {
                throw new Error(
                    `${assembledSliderRangeFormField.path.join("/")} only has ${
                        assembledSliderRangeFormField.sliderExtremity
                    } extremity`
                );
            }
            return assembledSliderRangeFormField;
        });
    }

    return { assembleFormFields };
})();

export function scaffoldingIndexedFormFieldsToFinal(
    scaffoldingIndexedFormFields: IndexedFormFields.Scaffolding
): IndexedFormFields.Final {
    const indexedFormFields: IndexedFormFields.Final = {};

    Object.entries(scaffoldingIndexedFormFields).forEach(
        ([
            dependencyNamePackageNameOrGlobal,
            { meta, formFieldsByTabName: scaffoldingFormFieldsByTabName }
        ]) => {
            const formFieldsByTabName: IndexedFormFields.Final[string]["formFieldsByTabName"] =
                {};

            Object.entries(scaffoldingFormFieldsByTabName).forEach(
                ([tabName, { description, formFields: allFormFields }]) => {
                    const nonSliderRangeFormFields: Exclude<
                        FormField,
                        FormField.Slider.Range
                    >[] = [];
                    const sliderRangeFormFields: FormField.Slider.Range[] = [];

                    allFormFields.forEach(formField => {
                        if (
                            formField.type === "slider" &&
                            formField.sliderVariation === "range"
                        ) {
                            sliderRangeFormFields.push(formField);
                        } else {
                            nonSliderRangeFormFields.push(formField);
                        }
                    });

                    formFieldsByTabName[tabName] = {
                        description,
                        "formFields": nonSliderRangeFormFields,
                        "assembledSliderRangeFormFields":
                            assembleFormFields(sliderRangeFormFields)
                    };
                }
            );

            indexedFormFields[dependencyNamePackageNameOrGlobal] = {
                meta,
                formFieldsByTabName
            };
        }
    );

    return indexedFormFields;
}
