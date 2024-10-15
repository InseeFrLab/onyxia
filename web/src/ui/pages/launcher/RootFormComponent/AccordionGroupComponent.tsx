import type {
    FormField,
    FormFieldGroup,
    FormFieldValue
} from "core/usecases/launcher/decoupledLogic/formTypes";
import { AccordionFromComponent } from "./AccordionFromComponent";
import { tss } from "tss";

type Props = {
    className?: string;
    accordionEntries: {
        title: string;
        description: string | undefined;
        nodes: (FormFieldGroup | FormField)[];
    }[];
    onChange: (params: FormFieldValue) => void;
    onAdd: (params: { helmValuesPath: (string | number)[] }) => void;
    onRemove: (params: { helmValuesPath: (string | number)[]; index: number }) => void;
};

export function AccordionGroupComponent(props: Props) {
    const { className, accordionEntries, onChange, onAdd, onRemove } = props;

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
                    onChange={onChange}
                    onAdd={onAdd}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
}

const useStyles = tss.withName({ AccordionFromComponent }).create(() => ({
    "root": {},
    "accordion": {}
}));
