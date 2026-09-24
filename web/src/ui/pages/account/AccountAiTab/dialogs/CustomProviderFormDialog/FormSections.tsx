import { alpha } from "@mui/material/styles";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Text } from "onyxia-ui/Text";
import type { ReactNode } from "react";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import { ModelsSelection } from "../../shared/ModelsSelection";
import { providerTypeLogoUrl } from "../../shared/providerTypeLogoUrl";
import { FormSelectField, FormTextField } from "../../shared/FormFields";
import type { FormTest } from "./types";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";

export function ProviderSection(props: {
    name: string;
    protocol: string;
    supportedProtocols: readonly AiConfig.SupportedAiProviderType[];
    onNameChange: (value: string) => void;
    onProtocolChange: (value: AiConfig.SupportedAiProviderType) => void;
    nameError?: string;
}) {
    const {
        name,
        protocol,
        supportedProtocols,
        onNameChange,
        onProtocolChange,
        nameError
    } = props;
    const { t } = useTranslation("CustomProviderFormDialog");

    const protocolOptions = (
        [
            { value: "deepseek", label: t("deepseek provider option") },
            { value: "openai", label: t("openai provider option") },
            {
                value: "openai-compatible",
                label: t("openai compatible provider option")
            },
            { value: "mistral", label: t("mistral provider option") },
            { value: "anthropic", label: t("anthropic provider option") }
        ] satisfies { value: AiConfig.SupportedAiProviderType; label: string }[]
    )
        .filter(({ value }) => supportedProtocols.includes(value))
        .map(option => ({ ...option, iconUrl: providerTypeLogoUrl[option.value] }));

    return (
        <FormSection title={t("custom provider section title")}>
            <FormSelectField
                label={t("custom provider type field")}
                value={protocol}
                onChange={value => {
                    const protocol = supportedProtocols.find(
                        protocol => protocol === value
                    );

                    if (protocol === undefined) {
                        return;
                    }

                    onProtocolChange(protocol);
                }}
                options={protocolOptions}
            />
            <FormTextField
                label={t("custom provider label field")}
                value={name}
                onChange={onNameChange}
                autoComplete="off"
                errorMessage={nameError}
            />
        </FormSection>
    );
}

export function CredentialsSection(props: {
    apiBase: string;
    apiKey: string;
    onFieldChange: (key: "apiBase" | "apiKey", value: string) => void;
    apiBaseError?: string;
    onApiBaseBlur?: () => void;
}) {
    const { apiBase, apiKey, onFieldChange, apiBaseError, onApiBaseBlur } = props;
    const { t } = useTranslation("CustomProviderFormDialog");

    return (
        <FormSection
            title={t("credentials section title")}
            subtitle={t("credentials section subtitle")}
        >
            <FormTextField
                label={t("custom provider api base field")}
                value={apiBase}
                onChange={value => onFieldChange("apiBase", value)}
                autoComplete="url"
                errorMessage={apiBaseError}
                onBlur={onApiBaseBlur}
            />
            <FormTextField
                label={t("custom provider api key field")}
                value={apiKey}
                onChange={value => onFieldChange("apiKey", value)}
                autoComplete="off"
                isSensitive={true}
            />
        </FormSection>
    );
}

export function VerificationSection(props: {
    test: FormTest;
    canTest: boolean;
    onTest: () => void;
    selectedModels: string[];
    onSelectedModelsChange: (models: string[]) => void;
}) {
    const { test, canTest, onTest, selectedModels, onSelectedModelsChange } = props;
    const { t } = useTranslation("CustomProviderFormDialog");
    const { classes, theme } = useStyles();

    return (
        <FormSection
            title={t("verification section title")}
            subtitle={t("verification section subtitle")}
            action={
                <Button
                    variant="ternary"
                    className={classes.testButton}
                    startIcon={getIconUrlByName("NetworkCheck")}
                    disabled={!canTest}
                    onClick={onTest}
                >
                    {t("provider test")}
                </Button>
            }
        >
            <ModelsSelection
                models={
                    test.stateDescription === "success"
                        ? test.models.map(model => model.id)
                        : []
                }
                selectedModels={selectedModels}
                disabled={test.stateDescription !== "success"}
                onSelectedModelsChange={onSelectedModelsChange}
            />

            {test.stateDescription === "testing" && (
                <div className={classes.testingMessage} role="status">
                    <CircularProgress size={theme.spacing(3)} />
                    <Text typo="label 1">{t("provider testing")}</Text>
                </div>
            )}

            {test.stateDescription === "success" && (
                <StatusMessage severity="success">
                    {t("provider test success")}
                </StatusMessage>
            )}

            {test.stateDescription === "error" && (
                <StatusMessage severity="error">{t("provider test error")}</StatusMessage>
            )}
        </FormSection>
    );
}

function FormSection(props: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    const { title, subtitle, action, children } = props;
    const { classes, cx } = useStyles();

    return (
        <section
            className={cx(
                classes.section,
                action !== undefined && classes.sectionWithAction
            )}
        >
            <div className={classes.headingRow}>
                <SectionHeading title={title} subtitle={subtitle} />
                {action}
            </div>
            <div
                className={cx(
                    classes.fields,
                    action !== undefined && classes.sectionWithAction
                )}
            >
                {children}
            </div>
        </section>
    );
}

function SectionHeading(props: { title: string; subtitle: string | undefined }) {
    const { title, subtitle } = props;
    const { classes } = useStyles_SectionHeading();

    return (
        <div className={classes.root}>
            <Text typo="object heading">{title}</Text>
            {subtitle !== undefined && (
                <Text typo="body 1" color="secondary">
                    {subtitle}
                </Text>
            )}
        </div>
    );
}

function StatusMessage(props: { severity: "success" | "error"; children: ReactNode }) {
    const { severity, children } = props;
    const { classes, cx } = useStyles_StatusMessage();

    return (
        <div
            className={cx(
                classes.root,
                severity === "success" ? classes.success : classes.error
            )}
            role={severity === "error" ? "alert" : "status"}
        >
            <span
                className={cx(
                    classes.dot,
                    severity === "success" ? classes.dotSuccess : classes.dotError
                )}
            />
            <Text typo="label 1">{children}</Text>
        </div>
    );
}

const useStyles = tss
    .withName({ CustomProviderFormSections: FormSection })
    .create(({ theme }) => ({
        section: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2.5),
            paddingBottom: theme.spacing(4),
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            "&:last-child": {
                borderBottom: "none",
                paddingBottom: 0
            }
        },
        fields: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3)
        },
        sectionWithAction: {
            gap: theme.spacing(4)
        },
        headingRow: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing(6)
        },
        testButton: {
            flex: "none",
            ...theme.typography.variants["label 2"].style,
            borderWidth: 0,
            padding: `${theme.spacing(1)}px ${theme.spacing(2.5)}px`,
            // Figma's `surface-action-secondary`: the inverse of the current surface
            backgroundColor: theme.colors.useCases.typography.textPrimary,
            color: theme.colors.useCases.surfaces.background,
            "&:hover": {
                backgroundColor: theme.colors.useCases.typography.textPrimary,
                color: theme.colors.useCases.surfaces.background
            },
            "& .MuiButton-startIcon": {
                marginLeft: 0,
                marginRight: theme.spacing(1)
            },
            "& .MuiButton-startIcon > *": {
                width: theme.spacing(3),
                height: theme.spacing(3)
            },
            "&.Mui-disabled": {
                backgroundColor: theme.colors.useCases.typography.textPrimary,
                color: theme.colors.useCases.surfaces.background,
                opacity: 0.3
            }
        },
        testingMessage: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            padding: `${theme.spacing(2)}px ${theme.spacing(3)}px`
        }
    }));

const useStyles_SectionHeading = tss.withName({ SectionHeading }).create(({ theme }) => ({
    root: {
        minWidth: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    }
}));

const useStyles_StatusMessage = tss.withName({ StatusMessage }).create(({ theme }) => ({
    root: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        padding: `${theme.spacing(2)}px ${theme.spacing(3)}px`,
        borderRadius: theme.spacing(2),
        boxSizing: "border-box",
        color: theme.colors.useCases.typography.textPrimary
    },
    success: {
        backgroundColor: alpha(theme.colors.useCases.alertSeverity.success.main, 0.2)
    },
    error: {
        backgroundColor: alpha(theme.colors.useCases.alertSeverity.error.main, 0.2)
    },
    dot: {
        flex: "none",
        width: theme.spacing(3),
        height: theme.spacing(3),
        borderRadius: "50%"
    },
    dotSuccess: {
        backgroundColor: theme.colors.useCases.alertSeverity.success.main
    },
    dotError: {
        backgroundColor: theme.colors.useCases.alertSeverity.error.main
    }
}));
