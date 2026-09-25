import { Button } from "onyxia-ui/Button";
import { memo, type FormEventHandler, useState } from "react";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import { CredentialsSection, ProviderSection, VerificationSection } from "./FormSections";
import { SideDialog } from "../../shared/SideDialog";
import { AiAlert } from "../../shared/AiAlert";
import type { ViewProps } from "./types";

export const CustomProviderFormDialogView = memo((props: ViewProps) => {
    const {
        isEditing,
        values,
        test,
        selectedModels,
        canSave,
        canTest,
        supportedProtocols,
        onClose,
        onFieldChange,
        onProtocolChange,
        onTest,
        onSelectedModelsChange,
        onSave,
        hasSubmissionError,
        nameIsValid,
        apiBaseIsValid,
        isSubmitting
    } = props;

    const { classes } = useStyles();
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

                    <VerificationSection
                        test={test}
                        canTest={canTest}
                        onTest={onTest}
                        selectedModels={selectedModels}
                        onSelectedModelsChange={onSelectedModelsChange}
                    />
                    {hasSubmissionError && (
                        <AiAlert
                            title={t("submission error")}
                            message={t("submission error details")}
                        />
                    )}
                </fieldset>

                <div className={classes.footer}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("provider cancel")}
                    </Button>
                    <Button type="submit" disabled={!canSave}>
                        {t(isEditing ? "provider update" : "provider save")}
                    </Button>
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
        gap: theme.spacing(4),
        paddingBottom: theme.spacing(6)
    },
    footer: {
        flex: "none",
        display: "flex",
        justifyContent: "flex-end",
        gap: theme.spacing(1),
        paddingTop: theme.spacing(3),
        borderTop: `1px solid ${theme.colors.useCases.surfaces.surface3}`
    }
}));
