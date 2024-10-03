import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { IconButton } from "onyxia-ui/IconButton";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import ToolTip from "@mui/material/Tooltip";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    className?: string;
    title: string;
    description: string | JSX.Element | undefined;
    onResetToDefault: () => void;
    error: JSX.Element | string | undefined;
    children: JSX.Element;
    inputId: string | undefined;
};

export function FormFieldWrapper(props: Props) {
    const { className, title, description, onResetToDefault, error, inputId, children } =
        props;

    const { classes } = useStyles({
        "isErrored": error !== undefined
    });

    const { t } = useTranslation({ FormFieldWrapper });

    return (
        <div className={className}>
            <div className={classes.header}>
                <Text typo="label 1" className={classes.title}>
                    {
                        <label htmlFor={inputId} lang="und">
                            {title}
                        </label>
                    }
                </Text>
                <div style={{ "flex": 1 }} />
                <ToolTip title={t("reset to default")} placement="bottom">
                    <IconButton
                        onClick={onResetToDefault}
                        icon={id<MuiIconComponentName>("SettingsBackupRestore")}
                    />
                </ToolTip>
            </div>
            {description !== undefined && (
                <Text typo="caption" className={classes.description}>
                    {<span lang="und">{description}</span>}
                </Text>
            )}
            <div className={classes.childrenWrapper}>{children}</div>
            <div className={classes.errorWrapper}>
                {error !== undefined && (
                    <Text typo="caption" className={classes.error}>
                        {error}
                    </Text>
                )}
            </div>
        </div>
    );
}

const useStyles = tss
    .withName({ FormFieldWrapper })
    .withParams<{ isErrored: boolean }>()
    .create(({ theme, isErrored }) => ({
        "title": {
            "color": !isErrored
                ? undefined
                : theme.colors.useCases.alertSeverity.error.main
        },
        "description": {
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
        },
        "error": {
            "color": theme.colors.useCases.alertSeverity.error.main
        }
    }));

const { i18n } = declareComponentKeys<"reset to default">()({ FormFieldWrapper });

export type I18n = typeof i18n;
