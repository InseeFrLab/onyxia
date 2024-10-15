import { tss } from "tss";
import type { RootForm } from "core/usecases/launcher/decoupledLogic/formTypes";
import type { FormCallbacks } from "./FormCallbacks";

type Props = {
    className?: string;
    rootForm: RootForm;
    callbacks: FormCallbacks;
};

export function RootFormComponent(props: Props) {
    const { className, rootForm, callbacks } = props;

    const { classes, cx } = useStyles();

    return <div className={cx(classes.root, className)}></div>;
}

const useStyles = tss.withName({ RootFormComponent }).create(() => ({
    "root": {}
}));
