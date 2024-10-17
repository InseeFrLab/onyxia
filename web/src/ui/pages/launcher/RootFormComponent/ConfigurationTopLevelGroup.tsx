import { tss } from "tss";
import { useMemo } from "react";
import type {
    FormFieldGroup,
    FormField
} from "core/usecases/launcher/decoupledLogic/formTypes";
import { AccordionGroupComponent } from "./AccordionGroupComponent";
import type { FormCallbacks } from "./FormCallbacks";

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
        const main_formFields: FormField[] = [];
        const main_formFieldGroups: FormFieldGroup[] = [];

        for (const node of main) {
            if (node.type === "field") {
                main_formFields.push(node);
            } else {
                main_formFieldGroups.push(node);
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
                ...main_formFieldGroups.map(
                    ({ nodes, description, helmValuesPath, canAdd, canRemove }) => ({
                        helmValuesPath,
                        description,
                        canAdd,
                        canRemove,
                        nodes
                    })
                )
            ]}
            callbacks={callbacks}
        />
    );
}

const useStyles = tss.withName({ ConfigurationTopLevelGroup }).create(() => ({
    "root": {}
}));
