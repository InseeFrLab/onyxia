import { tss } from "tss";
import { useMemo } from "react";
import type {
    FormFieldGroup,
    FormField
} from "core/usecases/launcher/decoupledLogic/formTypes";
import { AccordionGroupComponent } from "./AccordionGroupComponent";
import type { FormCallbacks } from "./FormCallbacks";
import { id } from "tsafe/id";

type Props = {
    className?: string;
    main: FormFieldGroup["nodes"];
    global: FormFieldGroup["nodes"];
    callbacks: FormCallbacks;
};

export function ConfigurationTopLevelGroup(props: Props) {
    const { className, main, global, callbacks } = props;

    const { cx, classes } = useStyles();

    const { main_formFields, main_formFieldGroups } = useMemo(() => {
        const main_formFields: Exclude<FormField, FormField.YamlCodeBlock>[] = [];
        const main_formFieldGroups: (FormFieldGroup | FormField.YamlCodeBlock)[] = [];

        for (const node of main) {
            switch (node.type) {
                case "field":
                    if (node.fieldType === "yaml code block") {
                        main_formFieldGroups.push(node);
                        break;
                    }
                    main_formFields.push(node);
                    break;
                case "group":
                    main_formFieldGroups.push(node);
                    break;
            }
        }

        return { main_formFields, main_formFieldGroups };
    }, [main]);

    return (
        <AccordionGroupComponent
            className={cx(classes.root, className)}
            accordionEntries={[
                ...(global.length === 0
                    ? []
                    : [
                          {
                              "helmValuesPath": ["Global"],
                              "description": "configuration that applies to all charts",
                              "canAdd": false,
                              "canRemove": false,
                              "nodes": global
                          }
                      ]),
                ...(main_formFields.length === 0
                    ? []
                    : [
                          {
                              "helmValuesPath": ["Miscellaneous"],
                              // TODO: i18n
                              "description": "Top level configuration values",
                              "canAdd": false,
                              "canRemove": false,
                              "nodes": main_formFields
                          }
                      ]),
                ...main_formFieldGroups.map(node => {
                    if (node.type === "field") {
                        return {
                            "helmValuesPath": [node.title],
                            "description": node.description,
                            "canAdd": false,
                            "canRemove": false,
                            "nodes": [
                                id<FormField.YamlCodeBlock>({
                                    "type": "field",
                                    "fieldType": "yaml code block",
                                    "description": "",
                                    "expectedDataType": node.expectedDataType,
                                    "helmValuesPath": node.helmValuesPath,
                                    "isReadonly": node.isReadonly,
                                    "title": "",
                                    "value": node.value
                                })
                            ]
                        };
                    }

                    return {
                        "helmValuesPath": node.helmValuesPath,
                        "description": node.description,
                        "canAdd": node.canAdd,
                        "canRemove": node.canRemove,
                        "nodes": node.nodes
                    };
                })
            ]}
            callbacks={callbacks}
        />
    );
}

const useStyles = tss.withName({ ConfigurationTopLevelGroup }).create(() => ({
    "root": {}
}));
