import type { ReactNode } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { capitalize } from "tsafe/capitalize";
import { useBackgroundColor } from "ui/tools/useBackgroundColor";

export function FormFieldGroupComponentWrapper(props: {
    className?: string;
    title: string | undefined;
    description: string | undefined;
    onAdd: (() => void) | undefined;
    children: ReactNode;
}) {
    const { className, title, description, onAdd, children } = props;

    const { t } = useTranslation({ FormFieldGroupComponentWrapper });

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
            {children}
            {onAdd !== undefined && (
                <Button
                    startIcon={id<MuiIconComponentName>("AddCircleOutline")}
                    variant="ternary"
                    onClick={onAdd}
                >
                    {t("add")}
                </Button>
            )}
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
        }
    }));

const { i18n } = declareComponentKeys<"add">()({ FormFieldGroupComponentWrapper });

export type I18n = typeof i18n;
