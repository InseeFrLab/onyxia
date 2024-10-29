import { useId } from "react";
import type {
    FormField,
    FormFieldGroup
} from "core/usecases/launcher/decoupledLogic/formTypes";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { Text } from "onyxia-ui/Text";
import { FormFieldGroupComponentInner } from "./FormFieldGroupComponent";
import type { FormCallbacks } from "./FormCallbacks";
import { capitalize } from "tsafe/capitalize";
import { assert } from "tsafe/assert";

type Props = {
    className?: string;
    helmValuesPath: (string | number)[];
    description: string | undefined;
    nodes: (FormFieldGroup | FormField)[];
    canAdd: boolean;
    canRemove: boolean;
    callbacks: FormCallbacks;
};

export function AccordionFromComponent(props: Props) {
    const {
        className,
        helmValuesPath,
        description,
        nodes,
        canAdd,
        canRemove,
        callbacks
    } = props;

    const { classes, cx } = useStyles();

    const contentId = useId();

    return (
        <Accordion className={cx(classes.root, className)}>
            <AccordionSummary
                classes={{
                    "root": classes.summary,
                    "content": classes.summaryContent,
                    "expanded": classes.summaryExpanded,
                    "expandIconWrapper": classes.summaryExpandIconWrapper
                }}
                expandIcon={<Icon icon={"ExpandMore" satisfies MuiIconComponentName} />}
                aria-controls={contentId}
            >
                <Text typo="label 1" componentProps={{ "lang": "und" }}>
                    {(() => {
                        const lastSegment = helmValuesPath[helmValuesPath.length - 1];

                        assert(typeof lastSegment === "string");

                        return capitalize(lastSegment);
                    })()}
                </Text>
                <Text typo="caption" color="secondary" componentProps={{ "lang": "und" }}>
                    {description}
                </Text>
            </AccordionSummary>
            <AccordionDetails id={contentId} className={classes.details}>
                <FormFieldGroupComponentInner
                    className={classes.group}
                    nodes={nodes}
                    helmValuesPath={helmValuesPath}
                    canAdd={canAdd}
                    canRemove={canRemove}
                    callbacks={callbacks}
                />
            </AccordionDetails>
        </Accordion>
    );
}

const useStyles = tss
    .withName({ AccordionFromComponent })
    .withNestedSelectors<"summary" | "summaryExpanded">()
    .create(({ theme, classes }) => ({
        "root": {
            "backgroundColor": theme.colors.useCases.surfaces.surface1
        },
        "summaryExpanded": {},
        "summary": {
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            [`&.${classes.summaryExpanded}`]: {
                "borderBottom": `1px solid ${theme.colors.useCases.typography.textDisabled}`
            }
        },
        "summaryContent": {
            "display": "block",
            "gap": theme.spacing(2),
            "paddingLeft": theme.spacing(4)
        },
        "summaryExpandIconWrapper": {
            "color": theme.colors.useCases.typography.textPrimary,
            [`.${classes.summary}:hover &`]: {
                "color": theme.colors.useCases.typography.textFocus
            }
        },
        "details": {
            "paddingTop": theme.spacing(4),
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "paddingLeft": theme.spacing(4)
        },
        "group": {
            "padding": theme.spacing(2)
        }
    }));
