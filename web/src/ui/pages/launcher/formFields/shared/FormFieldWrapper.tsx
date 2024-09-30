import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { IconButton } from "onyxia-ui/IconButton";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";

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
            <div className={classes.header}>
                <Text typo="object heading">{<span lang="und">{title}</span>}</Text>
                <div style={{ "flex": 1 }} />
                <IconButton
                    onClick={onResetToDefault}
                    icon={id<MuiIconComponentName>("SettingsBackupRestore")}
                />
            </div>
            {description !== undefined && (
                <Text typo="caption">{<span lang="und">{description}</span>}</Text>
            )}

            <div className={classes.childrenWrapper}>{children}</div>
            <div className={classes.errorWrapper}>{error !== undefined && error}</div>
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
        },
        "header": {
            "display": "flex",
            "alignItems": "center"
        },
        "childrenWrapper": {
            "marginTop": theme.spacing(4)
        },
        "errorWrapper": {
            "marginTop": theme.spacing(3),
            "minHeight": theme.typography.rootFontSizePx * 1.5
        }
    }));
