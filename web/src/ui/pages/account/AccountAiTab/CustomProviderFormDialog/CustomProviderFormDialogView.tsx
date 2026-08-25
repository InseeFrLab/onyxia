import Checkbox from "@mui/material/Checkbox";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { memo, type FormEventHandler } from "react";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import { CredentialsSection, ProviderSection, VerificationSection } from "./FormSections";
import { SideDialog } from "./SideDialog";
import type { ViewProps } from "./types";

export const CustomProviderFormDialogView = memo((props: ViewProps) => {
    const {
        isEditing,
        isAlreadyDefault,
        values,
        test,
        doSetAsDefault,
        canSave,
        canTest,
        supportedProtocols,
        onClose,
        onFieldChange,
        onProviderChange,
        onTest,
        onSave,
        onDoSetAsDefaultChange
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation("CustomProviderFormDialog");

    const onSubmit: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault();

        if (canSave) {
            onSave();
        }
    };

    return (
        <SideDialog
            title={t(
                isEditing ? "edit custom provider title" : "add custom provider title"
            )}
            closeLabel={t("close aria label")}
            onClose={onClose}
        >
            <form className={classes.root} onSubmit={onSubmit} noValidate={true}>
                <div className={classes.body}>
                    <ProviderSection
                        name={values.name}
                        provider={values.provider}
                        supportedProtocols={supportedProtocols}
                        onNameChange={value => onFieldChange("name", value)}
                        onProviderChange={onProviderChange}
                    />

                    <CredentialsSection
                        apiBase={values.apiBase}
                        apiKey={values.apiKey}
                        onFieldChange={onFieldChange}
                    />

                    <VerificationSection
                        selectedModelId={values.selectedModelId}
                        test={test}
                        canTest={canTest}
                        onSelectedModelIdChange={value =>
                            onFieldChange("selectedModelId", value)
                        }
                        onTest={onTest}
                    />
                </div>

                <div className={classes.footer}>
                    <label className={classes.defaultProviderControl}>
                        <Checkbox
                            className={classes.defaultProviderCheckbox}
                            checked={doSetAsDefault}
                            disabled={isAlreadyDefault}
                            onChange={event =>
                                onDoSetAsDefaultChange(event.target.checked)
                            }
                        />
                        <Text typo="label 1">{t("set as default provider")}</Text>
                    </label>

                    <div className={classes.actions}>
                        <Button
                            variant="secondary"
                            className={cx(classes.compactButton, classes.cancelButton)}
                            onClick={onClose}
                        >
                            {t("provider cancel")}
                        </Button>
                        <Button
                            type="submit"
                            className={cx(classes.compactButton, classes.saveButton)}
                            disabled={!canSave}
                        >
                            {t(isEditing ? "provider update" : "provider save")}
                        </Button>
                    </div>
                </div>
            </form>
        </SideDialog>
    );
});

const useStyles = tss.withName({ CustomProviderFormDialogView }).create(({ theme }) => ({
    root: {
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        color: theme.colors.useCases.typography.textPrimary
    },
    body: {
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4)
    },
    footer: {
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(3),
        paddingTop: theme.spacing(4)
    },
    defaultProviderControl: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(3),
        cursor: "pointer"
    },
    defaultProviderCheckbox: {
        padding: 0
    },
    actions: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2)
    },
    compactButton: {
        ...theme.typography.variants["label 2"].style,
        borderWidth: 0,
        padding: `${theme.spacing(1)}px ${theme.spacing(2.5)}px`
    },
    cancelButton: {
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textPrimary
    },
    saveButton: {
        backgroundColor: theme.colors.useCases.buttons.actionActive,
        color: theme.colors.useCases.surfaces.background,
        "&.Mui-disabled": {
            backgroundColor: theme.colors.useCases.buttons.actionActive,
            color: theme.colors.useCases.surfaces.background,
            opacity: 0.3
        }
    }
}));
