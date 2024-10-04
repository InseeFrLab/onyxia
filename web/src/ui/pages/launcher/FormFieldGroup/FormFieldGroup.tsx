import { tss } from "tss";
import { FormFieldGroupWrapper } from "./FormFieldGroupWrapper";

type Props = {
    className?: string;
    description: string | undefined;
    onRemove: ((params: { index: string }) => void) | undefined;
    onAdd: (() => void) | undefined;
};

export function FormFieldGroup(props: Props) {
    const { className, description, onAdd, onRemove } = props;

    const { cx, classes } = useStyles();

    return (
        <FormFieldGroupWrapper
            className={cx(classes.root, className)}
            description={description}
            onAdd={onAdd}
        ></FormFieldGroupWrapper>
    );
}

const useStyles = tss.withName({ FormFieldGroup }).create(() => ({
    "root": {}
}));
