import { tss } from "tss";
import { useMemo } from "react";
import type {
    FormFieldGroup,
    FormField
} from "core/usecases/launcher/decoupledLogic/formTypes";
import { AccordionGroupComponent } from "./AccordionGroupComponent";
import { assert } from "tsafe/assert";
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

    console.log("render");

    return (
        <AccordionGroupComponent
            className={cx(classes.root, className)}
            accordionEntries={[
                ...(global.length === 0
                    ? []
                    : [
                          {
                              "title": "Global",
                              "description": "configuration that applies to all charts",
                              "nodes": global
                          }
                      ]),
                ...(main_formFields.length === 0
                    ? []
                    : [
                          {
                              "title": "Miscellaneous",
                              // TODO: i18n
                              "description": "Top level configuration values",
                              "nodes": main_formFields
                          }
                      ]),
                ...main_formFieldGroups.map(({ nodes, description, helmValuesPath }) => ({
                    "title": (() => {
                        const lastSegment = helmValuesPath[helmValuesPath.length - 1];
                        assert(typeof lastSegment === "string");
                        return lastSegment;
                    })(),
                    description,
                    nodes
                }))
            ]}
            callbacks={callbacks}
        />
    );
}

const useStyles = tss.withName({ ConfigurationTopLevelGroup }).create(() => ({
    "root": {}
}));
