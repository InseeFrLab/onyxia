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
        helmValuesPath: (string | number)[];
        description: string | undefined;
        canAdd: boolean;
        canRemove: boolean;
        nodes: (FormFieldGroup | FormField)[];
    }[];
    callbacks: FormCallbacks;
};

export function AccordionGroupComponent(props: Props) {
    const { className, accordionEntries, callbacks } = props;

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            {accordionEntries.map(
                ({ helmValuesPath, description, canAdd, canRemove, nodes }) => (
                    <AccordionFromComponent
                        key={JSON.stringify(helmValuesPath)}
                        className={classes.accordion}
                        helmValuesPath={helmValuesPath}
                        description={description}
                        canAdd={canAdd}
                        canRemove={canRemove}
                        nodes={nodes}
                        callbacks={callbacks}
                    />
                )
            )}
        </div>
    );
}

const useStyles = tss.withName({ AccordionFromComponent }).create(({ theme }) => ({
    "root": {
        "borderRadius": theme.spacing(2),
        "overflow": "hidden"
    },
    "accordion": {}
}));
