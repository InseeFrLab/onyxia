import { describe, it, expect } from "vitest";
import { mutateHelmValues_update } from "./mutateHelmValues_update";
import { symToStr } from "tsafe/symToStr";
import type { FormField, FormFieldGroup, RootForm } from "../../formTypes";
import {
    createObjectThatThrowsIfAccessed,
    createObjectWithSomePropertiesThatThrowIfAccessed,
    THROW_IF_ACCESSED
} from "clean-architecture/tools/createObjectThatThrowsIfAccessed";

describe(symToStr({ mutateHelmValues_update }), () => {
    it("simple case", () => {
        const helmValues = { r: "foo" };

        mutateHelmValues_update({
            helmValues,
            rootForm: createObjectThatThrowsIfAccessed<RootForm>(),
            formFieldValue: {
                fieldType: "text field",
                helmValuesPath: ["r"],
                value: "foo updated"
            }
        });

        expect(helmValues).toStrictEqual({
            r: "foo updated"
        });
    });

    it("works with select", () => {
        const helmValues = { r: "foo" };

        mutateHelmValues_update({
            helmValues,
            rootForm: {
                main: [
                    createObjectWithSomePropertiesThatThrowIfAccessed<FormField.Select>({
                        type: "field",
                        fieldType: "select",
                        helmValuesPath: ["r"],
                        options: ["foo", "bar"],
                        isReadonly: THROW_IF_ACCESSED,
                        description: THROW_IF_ACCESSED,
                        selectedOptionIndex: THROW_IF_ACCESSED,
                        title: THROW_IF_ACCESSED,
                        isHidden: THROW_IF_ACCESSED
                    })
                ],
                dependencies: {},
                disabledDependencies: [],
                global: []
            },
            formFieldValue: {
                fieldType: "select",
                helmValuesPath: ["r"],
                selectedOptionIndex: 1
            }
        });

        expect(helmValues).toStrictEqual({
            r: "bar"
        });
    });

    it("works with simple slider", () => {
        const helmValues = { r: "300m" };

        mutateHelmValues_update({
            helmValues,
            rootForm: {
                main: [
                    createObjectWithSomePropertiesThatThrowIfAccessed<FormField.Slider>({
                        type: "field",
                        fieldType: "slider",
                        helmValuesPath: ["r"],
                        unit: "m",
                        title: THROW_IF_ACCESSED,
                        isReadonly: THROW_IF_ACCESSED,
                        description: THROW_IF_ACCESSED,
                        min: THROW_IF_ACCESSED,
                        max: THROW_IF_ACCESSED,
                        step: THROW_IF_ACCESSED,
                        value: THROW_IF_ACCESSED,
                        isHidden: THROW_IF_ACCESSED
                    })
                ],
                dependencies: {},
                disabledDependencies: [],
                global: []
            },
            formFieldValue: {
                fieldType: "slider",
                helmValuesPath: ["r"],
                value: 400
            }
        });

        expect(helmValues).toStrictEqual({
            r: "400m"
        });
    });

    it("works with range sliders", () => {
        const helmValues = {
            resources: {
                requests: {
                    cpu: "500m"
                },
                limits: {
                    cpu: "300m"
                }
            }
        };

        mutateHelmValues_update({
            helmValues,
            rootForm: {
                main: [
                    createObjectWithSomePropertiesThatThrowIfAccessed<FormFieldGroup>({
                        type: "group",
                        helmValuesPath: ["resources"],
                        title: THROW_IF_ACCESSED,
                        description: THROW_IF_ACCESSED,
                        canAdd: THROW_IF_ACCESSED,
                        canRemove: THROW_IF_ACCESSED,
                        nodes: [
                            createObjectWithSomePropertiesThatThrowIfAccessed<FormField.RangeSlider>(
                                {
                                    type: "field",
                                    fieldType: "range slider",
                                    unit: "m",
                                    highEndRange:
                                        createObjectWithSomePropertiesThatThrowIfAccessed<FormField.RangeSlider.RangeEnd>(
                                            {
                                                isReadonly: THROW_IF_ACCESSED,
                                                helmValuesPath: [
                                                    "resources",
                                                    "requests",
                                                    "cpu"
                                                ],
                                                value: THROW_IF_ACCESSED,
                                                rangeEndSemantic: THROW_IF_ACCESSED,
                                                min: THROW_IF_ACCESSED,
                                                max: THROW_IF_ACCESSED,
                                                description: THROW_IF_ACCESSED
                                            }
                                        ),
                                    lowEndRange:
                                        createObjectWithSomePropertiesThatThrowIfAccessed<FormField.RangeSlider.RangeEnd>(
                                            {
                                                isReadonly: THROW_IF_ACCESSED,
                                                helmValuesPath: [
                                                    "resources",
                                                    "limits",
                                                    "cpu"
                                                ],
                                                value: THROW_IF_ACCESSED,
                                                rangeEndSemantic: THROW_IF_ACCESSED,
                                                min: THROW_IF_ACCESSED,
                                                max: THROW_IF_ACCESSED,
                                                description: THROW_IF_ACCESSED
                                            }
                                        ),
                                    step: THROW_IF_ACCESSED,
                                    title: THROW_IF_ACCESSED,
                                    isHidden: THROW_IF_ACCESSED
                                }
                            )
                        ],
                        isHidden: THROW_IF_ACCESSED
                    })
                ],
                dependencies: {},
                disabledDependencies: [],
                global: []
            },
            formFieldValue: {
                fieldType: "range slider",
                lowEndRange: {
                    helmValuesPath: ["resources", "limits", "cpu"],
                    value: 350
                },
                highEndRange: {
                    helmValuesPath: ["resources", "requests", "cpu"],
                    value: 450
                }
            }
        });

        expect(helmValues).toStrictEqual({
            resources: {
                limits: {
                    cpu: "350m"
                },
                requests: {
                    cpu: "450m"
                }
            }
        });
    });
});
