import Alert from "@mui/material/Alert";
import { Button } from "onyxia-ui/Button";
import { memo, type FormEventHandler, useState } from "react";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import { CredentialsSection, ProviderSection, VerificationSection } from "./FormSections";
import { SideDialog } from "./SideDialog";
import type { ViewProps } from "./types";

export const CustomProviderFormDialogView = memo((props: ViewProps) => {
    const {
        isEditing,
        values,
        test,
        canSave,
        canTest,
        supportedProtocols,
        onClose,
        onFieldChange,
        onProtocolChange,
        onTest,
        onSave,
        hasSubmissionError,
        nameIsValid,
        apiBaseIsValid,
        isSubmitting
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation("CustomProviderFormDialog");
    const [isApiBaseValidationVisible, setIsApiBaseValidationVisible] = useState(false);

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
                <fieldset className={classes.body} disabled={isSubmitting}>
                    <ProviderSection
                        name={values.name}
                        protocol={values.protocol}
                        supportedProtocols={supportedProtocols}
                        onNameChange={value => onFieldChange("name", value)}
                        onProtocolChange={onProtocolChange}
                        nameError={
                            nameIsValid === false && values.name !== ""
                                ? t("invalid name")
                                : undefined
                        }
                    />

                    <CredentialsSection
                        apiBase={values.apiBase}
                        apiKey={values.apiKey}
                        onFieldChange={(key, value) => {
                            if (key === "apiBase") setIsApiBaseValidationVisible(false);
                            onFieldChange(key, value);
                        }}
                        onApiBaseBlur={() => setIsApiBaseValidationVisible(true)}
                        apiBaseError={
                            isApiBaseValidationVisible &&
                            apiBaseIsValid === false &&
                            values.apiBase !== ""
                                ? t("invalid api base")
                                : undefined
                        }
                    />

                    <VerificationSection test={test} canTest={canTest} onTest={onTest} />
                    {hasSubmissionError && (
                        <Alert severity="error">{t("submission error")}</Alert>
                    )}
                </fieldset>

                <div className={classes.footer}>
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
        border: 0,
        padding: 0,
        margin: 0,
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
