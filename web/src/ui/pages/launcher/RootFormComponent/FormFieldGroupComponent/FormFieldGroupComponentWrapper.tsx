import type { ReactNode } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { capitalize } from "tsafe/capitalize";
import { useBackgroundColor } from "ui/tools/useBackgroundColor";
import { IconButton } from "onyxia-ui/IconButton";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";

export function FormFieldGroupComponentWrapper(props: {
    className?: string;
    title: string | undefined;
    description: string | undefined;
    onRemove: (() => void) | undefined;
    children: ReactNode;
}) {
    const { className, title, description, onRemove, children } = props;

    const { backgroundColor, setElement: setRootElement } = useBackgroundColor();

    const { cx, classes } = useStyles({ headingWrapperBackgroundColor: backgroundColor });

    return (
        <fieldset ref={setRootElement} className={cx(classes.root, className)}>
            {title !== undefined && (
                <div className={classes.headingWrapper}>
                    <Text typo="label 1" componentProps={{ "lang": "und" }}>
                        {capitalize(title)}
                    </Text>
                    {description !== undefined && (
                        <Text typo="caption" componentProps={{ "lang": "und" }}>
                            {description}
                        </Text>
                    )}
                </div>
            )}
            {onRemove !== undefined && (
                <IconButton
                    className={classes.removeButton}
                    iconClassName={classes.removeButtonIcon}
                    onClick={onRemove}
                    icon={"RemoveCircleOutline" as MuiIconComponentName}
                />
            )}
            {children}
        </fieldset>
    );
}

const useStyles = tss
    .withName({ FormFieldGroupComponentWrapper })
    .withParams<{ headingWrapperBackgroundColor: string }>()
    .create(({ theme, headingWrapperBackgroundColor }) => ({
        "root": {
            "border": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            "borderRadius": theme.spacing(3)
        },
        "headingWrapper": {
            "marginBottom": theme.spacing(2),
            "display": "inline-flex",
            "alignItems": "center",
            "gap": theme.spacing(2),
            "position": "relative",
            "top": -theme.typography.rootFontSizePx * 1.1,
            "left": theme.spacing(4),
            "backgroundColor": headingWrapperBackgroundColor,
            "borderRadius": theme.spacing(3),
            ...theme.spacing.rightLeft("padding", 2)
        },
        "removeButton": {
            "position": "absolute",
            "left": -theme.typography.rootFontSizePx * 1
        },
        "removeButtonIcon": {
            "color": theme.colors.useCases.alertSeverity.error.main
        }
    }));