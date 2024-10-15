import type {
    FormField,
    FormFieldGroup
} from "core/usecases/launcher/decoupledLogic/formTypes";
import { AccordionFromComponent } from "./AccordionFromComponent";
import { tss } from "tss";
import type { FormCallbacks } from "./FormCallbacks";

type Props = {
    className?: string;
    accordionEntries: {
        title: string;
        description: string | undefined;
        nodes: (FormFieldGroup | FormField)[];
    }[];
    callbacks: FormCallbacks;
};

export function AccordionGroupComponent(props: Props) {
    const { className, accordionEntries, callbacks } = props;

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            {accordionEntries.map(({ title, description, nodes }) => (
                <AccordionFromComponent
                    className={classes.accordion}
                    key={title}
                    title={title}
                    description={description}
                    nodes={nodes}
                    callbacks={callbacks}
                />
            ))}
        </div>
    );
}

const useStyles = tss.withName({ AccordionFromComponent }).create(() => ({
    "root": {},
    "accordion": {}
}));
