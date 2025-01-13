import type { ReactNode } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { IconButton } from "onyxia-ui/IconButton";
import { getIconUrlByName } from "lazy-icons";
import ToolTip from "@mui/material/Tooltip";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { capitalize } from "tsafe/capitalize";
import SettingsBackupRestoreIcon from "@mui/icons-material/SettingsBackupRestore";

type Props = {
    className?: string;
    title: string;
    description: string | JSX.Element | undefined;
    onResetToDefault: (() => void) | undefined;
    error: JSX.Element | string | undefined;
    inputId: string | undefined;
    onRemove: (() => void) | undefined;
    children: ReactNode;
};

export function FormFieldWrapper(props: Props) {
    const {
        className,
        title,
        description,
        onResetToDefault,
        error,
        inputId,
        onRemove,
        children
    } = props;

    console.log({ title, description });

    const { classes } = useStyles({
        isErrored: error !== undefined,
        isResetToDefaultButtonVisible: onResetToDefault !== undefined,
        hasEmptyTitle: title === ""
    });

    const { t } = useTranslation({ FormFieldWrapper });

    return (
        <div className={className}>
            <div className={classes.header}>
                {onRemove !== undefined && (
                    <IconButton
                        className={classes.removeButton}
                        iconClassName={classes.removeButtonIcon}
                        onClick={onRemove}
                        icon={getIconUrlByName("RemoveCircleOutline")}
                    />
                )}
                <Text typo="label 1" className={classes.title}>
                    {
                        <label htmlFor={inputId} lang="und">
                            {capitalize(title)}
                        </label>
                    }
                </Text>
                <div style={{ flex: 1 }} />
                <ToolTip title={t("reset to default")} placement="bottom">
                    <IconButton
                        className={classes.resetToDefaultButton}
                        onClick={onResetToDefault ?? (() => {})}
                        icon={SettingsBackupRestoreIcon}
                    />
                </ToolTip>
            </div>
            {description !== undefined && (
                <Text typo="caption" className={classes.description}>
                    {
                        <span lang="und">
                            {typeof description === "string"
                                ? capitalize(description)
                                : description}
                        </span>
                    }
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
    .withParams<{
        isErrored: boolean;
        isResetToDefaultButtonVisible: boolean;
        hasEmptyTitle: boolean;
    }>()
    .create(({ theme, isErrored, isResetToDefaultButtonVisible, hasEmptyTitle }) => ({
        title: {
            color: !isErrored ? undefined : theme.colors.useCases.alertSeverity.error.main
        },
        description: {
            color: !isErrored ? undefined : theme.colors.useCases.alertSeverity.error.main
        },
        header: {
            display: "flex",
            alignItems: "center",
            position: "relative",
            overflow: "visible"
        },
        removeButton: {
            position: "absolute",
            left: -theme.typography.rootFontSizePx * 2.5
        },
        removeButtonIcon: {
            color: theme.colors.useCases.alertSeverity.error.main
        },
        childrenWrapper: {
            marginTop: hasEmptyTitle ? undefined : theme.spacing(4)
        },
        errorWrapper: {
            marginTop: theme.spacing(3),
            minHeight: theme.typography.rootFontSizePx * 1.5
        },
        error: {
            color: theme.colors.useCases.alertSeverity.error.main
        },
        resetToDefaultButton: {
            visibility: isResetToDefaultButtonVisible ? "visible" : "hidden",
            paddingTop: hasEmptyTitle ? 0 : undefined
        }
    }));

const { i18n } = declareComponentKeys<"reset to default">()({ FormFieldWrapper });

export type I18n = typeof i18n;
