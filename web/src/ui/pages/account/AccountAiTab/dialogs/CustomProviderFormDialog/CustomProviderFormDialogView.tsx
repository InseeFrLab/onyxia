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
        view,
        onClose,
        onFieldChange,
        onProviderTypeChange,
        onTest,
        onSelectedModelsChange,
        onSave
    } = props;

    const { classes } = useStyles();
    const { t } = useTranslation("CustomProviderFormDialog");
    const [isApiBaseValidationVisible, setIsApiBaseValidationVisible] = useState(false);

    const onSubmit: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault();

        if (view.canSave) {
            onSave();
        }
    };

    return (
        <SideDialog
            title={t("add custom provider title")}
            closeLabel={t("close aria label")}
            onClose={onClose}
        >
            <form className={classes.root} onSubmit={onSubmit} noValidate={true}>
                <fieldset className={classes.body} disabled={view.isSaving}>
                    <ProviderSection
                        name={view.name.value}
                        protocol={view.providerType.value ?? ""}
                        supportedProtocols={view.providerType.options}
                        onNameChange={value => onFieldChange("name", value)}
                        onProtocolChange={onProviderTypeChange}
                        nameError={view.name.isInvalid ? t("invalid name") : undefined}
                    />

                    <CredentialsSection
                        apiBase={view.apiBase.value}
                        apiKey={view.apiKey.value}
                        onFieldChange={(key, value) => {
                            if (key === "apiBase") setIsApiBaseValidationVisible(false);
                            onFieldChange(key, value);
                        }}
                        onApiBaseBlur={() => setIsApiBaseValidationVisible(true)}
                        apiBaseError={
                            // Not while the user is still typing it
                            isApiBaseValidationVisible && view.apiBase.isInvalid
                                ? t("invalid api base")
                                : undefined
                        }
                    />

                    <VerificationSection
                        connectionTest={view.connectionTest}
                        models={view.models}
                        onTest={onTest}
                        onSelectedModelsChange={onSelectedModelsChange}
                    />
                    {view.hasSaveFailed && (
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
                    <Button type="submit" disabled={!view.canSave}>
                        {t("provider save")}
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
