import { describe, it, expect } from "vitest";
import { mutateHelmValues_update } from "./mutateHelmValues_update";
import { symToStr } from "tsafe/symToStr";
import type { FormField, RootForm } from "../../formTypes";
import {
    createPropertyThatThrowIfAccessed,
    createObjectThatThrowsIfAccessed
} from "clean-architecture/tools/createObjectThatThrowsIfAccessed";

describe(symToStr({ mutateHelmValues_update }), () => {
    it("simple case", () => {
        const helmValues = { "r": "foo" };

        mutateHelmValues_update({
            helmValues,
            "rootForm": createObjectThatThrowsIfAccessed<RootForm>(),
            "formFieldValue": {
                "fieldType": "text field",
                "helmValuesPath": ["r"],
                "value": "foo updated"
            }
        });

        expect(helmValues).toStrictEqual({
            "r": "foo updated"
        });
    });

    it("works with select", () => {
        const helmValues = { "r": "foo" };

        mutateHelmValues_update({
            helmValues,
            "rootForm": {
                "main": [
                    {
                        "type": "field",
                        "fieldType": "select",
                        "helmValuesPath": ["r"],
                        "options": ["foo", "bar"],
                        ...createPropertyThatThrowIfAccessed<
                            FormField.Select,
                            "isReadonly"
                        >("isReadonly"),
                        ...createPropertyThatThrowIfAccessed<
                            FormField.Select,
                            "description"
                        >("description"),
                        ...createPropertyThatThrowIfAccessed<
                            FormField.Select,
                            "selectedOptionIndex"
                        >("selectedOptionIndex"),
                        ...createPropertyThatThrowIfAccessed<FormField.Select, "title">(
                            "title"
                        )
                    }
                ],
                "dependencies": {},
                "disabledDependencies": [],
                "global": []
            },
            "formFieldValue": {
                "fieldType": "select",
                "helmValuesPath": ["r"],
                "selectedOptionIndex": 1
            }
        });

        expect(helmValues).toStrictEqual({
            "r": "bar"
        });
    });
});
