import { tss } from "tss";
import { useMemo } from "react";
import type {
    FormFieldGroup,
    FormField
} from "core/usecases/launcher/decoupledLogic/formTypes";
import { Accordion, type Props as PropsOfAccordion } from "./Accordion";
import type { FormCallbacks } from "./FormCallbacks";
import { id } from "tsafe/id";
import {
    createObjectThatThrowsIfAccessed,
    isObjectThatThrowIfAccessed
} from "clean-architecture/createObjectThatThrowsIfAccessed";

type Props = {
    className?: string;
    main: FormFieldGroup["nodes"];
    global: FormFieldGroup["nodes"];
    callbacks: FormCallbacks;
};

export function ConfigurationTopLevelGroup(props: Props) {
    const { className, main, global, callbacks } = props;

    const { cx, classes } = useStyles();

    const { accordionEntries } = useMemo(() => {
        const { main_formFieldGroups, main_formFields } = (() => {
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
        })();

        type AccordionEntry = Omit<PropsOfAccordion, "callbacks">;

        const accordionEntries: AccordionEntry[] = [
            ...(global.length === 0
                ? []
                : [
                      id<AccordionEntry>({
                          helmValuesPath:
                              createObjectThatThrowsIfAccessed<(string | number)[]>(),
                          title: "global",
                          description: "configuration that applies to all charts",
                          canAdd: false,
                          canRemove: false,
                          nodes: global,
                          isHidden: global.every(node => node.isHidden)
                      })
                  ]),
            ...(main_formFields.length === 0
                ? []
                : [
                      id<AccordionEntry>({
                          helmValuesPath:
                              createObjectThatThrowsIfAccessed<(string | number)[]>(),
                          // TODO: i18n
                          title: "miscellaneous",
                          description: "Top level configuration values",
                          canAdd: false,
                          canRemove: false,
                          nodes: main_formFields,
                          isHidden: main_formFields.every(node => node.isHidden)
                      })
                  ]),
            ...main_formFieldGroups.map(node => {
                if (node.type === "field") {
                    return id<AccordionEntry>({
                        helmValuesPath:
                            createObjectThatThrowsIfAccessed<(string | number)[]>(),
                        title: node.title,
                        description: node.description,
                        canAdd: false,
                        canRemove: false,
                        nodes: [
                            id<FormField.YamlCodeBlock>({
                                type: "field",
                                fieldType: "yaml code block",
                                description: "",
                                expectedDataType: node.expectedDataType,
                                helmValuesPath: node.helmValuesPath,
                                isReadonly: node.isReadonly,
                                title: "",
                                value: node.value,
                                isHidden: node.isHidden
                            })
                        ],
                        isHidden: node.isHidden
                    });
                }

                return id<AccordionEntry>({
                    helmValuesPath: node.helmValuesPath,
                    title: node.title,
                    description: node.description,
                    canAdd: node.canAdd,
                    canRemove: node.canRemove,
                    nodes: node.nodes,
                    isHidden: node.isHidden
                });
            })
        ];

        return { accordionEntries };
    }, [main]);

    return (
        <div className={cx(classes.root, className)}>
            {accordionEntries.map(
                ({
                    helmValuesPath,
                    title,
                    description,
                    canAdd,
                    canRemove,
                    nodes,
                    isHidden
                }) => (
                    <Accordion
                        key={(() => {
                            if (isObjectThatThrowIfAccessed(helmValuesPath)) {
                                return title;
                            }

                            return JSON.stringify(helmValuesPath);
                        })()}
                        helmValuesPath={helmValuesPath}
                        title={title}
                        description={description}
                        canAdd={canAdd}
                        canRemove={canRemove}
                        nodes={nodes}
                        callbacks={callbacks}
                        isHidden={isHidden}
                    />
                )
            )}
        </div>
    );
}

const useStyles = tss.withName({ ConfigurationTopLevelGroup }).create(({ theme }) => ({
    root: {
        marginBottom: theme.spacing(4),
        borderRadius: theme.spacing(2),
        overflow: "hidden"
    }
}));
