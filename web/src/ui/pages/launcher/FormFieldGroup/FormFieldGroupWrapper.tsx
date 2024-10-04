import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export function FormFieldGroupWrapper(props: {
    className?: string;
    description: string | undefined;
    onAdd: (() => void) | undefined;
    children: JSX.Element;
}) {
    const { className, description, onAdd, children } = props;

    const { cx, classes } = useStyles();

    const { t } = useTranslation({ FormFieldGroupWrapper });

    return (
        <fieldset className={cx(classes.root, className)}>
            {description !== undefined && (
                <Text typo="subtitle" className={classes.description}>
                    {description}
                </Text>
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

const useStyles = tss.withName({ FormFieldGroupWrapper }).create(({ theme }) => ({
    "root": {
        "border": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        "borderRadius": theme.spacing(2)
    },
    "description": {
        "marginBottom": theme.spacing(2)
    }
}));

const { i18n } = declareComponentKeys<"add">()({ FormFieldGroupWrapper });

export type I18n = typeof i18n;
