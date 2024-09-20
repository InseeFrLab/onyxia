import { tss } from "tss";

type Props = {
    className?: string;
    title: string;
    description: string | undefined;
    onResetToDefault: () => void;
    error: JSX.Element | string | undefined;
    children: JSX.Element;
};

export function FormFieldWrapper(props: Props) {
    const { className, title, description, onResetToDefault, error, children } = props;

    const { cx, classes } = useStyles({ "isErrored": error !== undefined });

    return (
        <div className={cx(classes.root, className)}>
            <h3 lang="und">{title}</h3>
            <button onClick={onResetToDefault}>Reset to default</button>
            {description !== undefined && <p lang="und">{description}</p>}
            {children}
            {error !== undefined && error}
        </div>
    );
}

const useStyles = tss
    .withName({ FormFieldWrapper })
    .withParams<{ isErrored: boolean }>()
    .create(({ theme, isErrored }) => ({
        "root": {
            "color": !isErrored
                ? undefined
                : theme.colors.useCases.alertSeverity.error.main
        }
    }));
