import { tss } from "tss";
import { useMemo } from "react";
import type {
    FormFieldGroup,
    FormField,
    FormFieldValue
} from "core/usecases/launcher/decoupledLogic/formTypes";
import { AccordionGroupComponent } from "./AccordionGroupComponent";
import { assert } from "tsafe/assert";

type Props = {
    className?: string;
    main: FormFieldGroup["nodes"];
    global: FormFieldGroup["nodes"];
    onChange: (params: FormFieldValue) => void;
    onAdd: (params: { helmValuesPath: (string | number)[] }) => void;
    onRemove: (params: { helmValuesPath: (string | number)[]; index: number }) => void;
};

export function ConfigurationTopLevelGroup(props: Props) {
    const { className, main, global, onAdd, onChange, onRemove } = props;

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
                ...(global === undefined
                    ? []
                    : [
                          {
                              "title": "Global",
                              "description": "configuration that applies to all charts",
                              "nodes": global
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
            onAdd={onAdd}
            onChange={onChange}
            onRemove={onRemove}
        />
    );
}

const useStyles = tss.withName({ ConfigurationTopLevelGroup }).create(() => ({
    "root": {}
}));
