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

type Props = {
    className?: string;
    title: string;
    description: string | undefined;
    nodes: (FormFieldGroup | FormField)[];
    callbacks: FormCallbacks;
};

export function AccordionFromComponent(props: Props) {
    const { className, title, description, nodes, callbacks } = props;

    const { classes, cx } = useStyles();

    const contentId = useId();

    return (
        <Accordion className={cx(classes.root, className)}>
            <AccordionSummary
                expandIcon={<Icon icon={"ExpandMore" satisfies MuiIconComponentName} />}
                aria-controls={contentId}
            >
                <span lang="und">{title}</span>
            </AccordionSummary>
            <AccordionDetails id={contentId}>
                {description !== undefined && (
                    <Text typo="subtitle" componentProps={{ "lang": "und" }}>
                        {description}
                    </Text>
                )}
            </AccordionDetails>
            <FormFieldGroupComponentInner
                className={classes.group}
                nodes={nodes}
                callbacks={callbacks}
            />
        </Accordion>
    );
}

const useStyles = tss.withName({ AccordionFromComponent }).create(() => ({
    "root": {},
    "group": {}
}));
