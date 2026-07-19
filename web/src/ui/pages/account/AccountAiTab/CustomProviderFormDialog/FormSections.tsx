import { alpha } from "@mui/material/styles";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Text } from "onyxia-ui/Text";
import type { ReactNode } from "react";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import { FormSelectField, FormTextField, ModelSelectField } from "./FormFields";
import type { FormTest, FormValues } from "./types";

export function ProviderSection(props: {
    name: string;
    provider: string;
    supportedProtocols: readonly string[];
    onNameChange: (value: string) => void;
    onProviderChange: (value: string) => void;
}) {
    const { name, provider, supportedProtocols, onNameChange, onProviderChange } = props;
    const { t } = useTranslation("CustomProviderFormDialog");

    const providerOptions = [
        { value: "openai", label: t("openai provider option") },
        {
            value: "openai-compatible",
            label: t("openai compatible provider option")
        },
        { value: "mistral", label: t("mistral provider option") },
        { value: "anthropic", label: t("anthropic provider option") }
    ].filter(({ value }) => supportedProtocols.includes(value));

    return (
        <FormSection
            title={t("custom provider section title")}
            subtitle={t("custom provider section subtitle")}
        >
            <FormTextField
                label={t("custom provider label field")}
                value={name}
                onChange={onNameChange}
                autoComplete="off"
            />
            <FormSelectField
                label={t("custom provider type field")}
                value={provider}
                onChange={onProviderChange}
                options={providerOptions}
            />
        </FormSection>
    );
}

export function CredentialsSection(props: {
    apiBase: string;
    apiKey: string;
    onFieldChange: (key: "apiBase" | "apiKey", value: string) => void;
}) {
    const { apiBase, apiKey, onFieldChange } = props;
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
    selectedModelId: FormValues["selectedModelId"];
    test: FormTest;
    canTest: boolean;
    onSelectedModelIdChange: (value: string) => void;
    onTest: () => void;
}) {
    const { selectedModelId, test, canTest, onSelectedModelIdChange, onTest } = props;
    const { t } = useTranslation("CustomProviderFormDialog");
    const { classes } = useStyles();

    const testedModels = test.stateDescription === "success" ? test.models : undefined;

    return (
        <FormSection
            title={t("verification section title")}
            subtitle={t("verification section subtitle")}
            action={
                <Button
                    variant="ternary"
                    className={classes.testButton}
                    startIcon={getIconUrlByName("SatelliteAlt")}
                    disabled={!canTest}
                    onClick={onTest}
                >
                    {t("provider test")}
                </Button>
            }
        >
            <ModelSelectField
                label={t("custom provider model field")}
                value={selectedModelId}
                onChange={onSelectedModelIdChange}
                models={testedModels ?? []}
                disabled={testedModels === undefined}
            />

            {test.stateDescription === "testing" && (
                <div className={classes.testingMessage} role="status">
                    <CircularProgress size={16} />
                    <Text typo="body 2">{t("provider testing")}</Text>
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
    subtitle: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    const { title, subtitle, action, children } = props;
    const { classes } = useStyles();

    return (
        <section className={classes.section}>
            {action === undefined ? (
                <>
                    <SectionHeading title={title} subtitle={subtitle} />
                    <div className={classes.fields}>{children}</div>
                </>
            ) : (
                <>
                    <div className={classes.verificationHeadingRow}>
                        <SectionHeading title={title} subtitle={subtitle} />
                        {action}
                    </div>
                    {children}
                </>
            )}
        </section>
    );
}

function SectionHeading(props: { title: string; subtitle: string }) {
    const { title, subtitle } = props;
    const { classes } = useStyles_SectionHeading();

    return (
        <div className={classes.root}>
            <Text typo="object heading">{title}</Text>
            <Text typo="body 2" color="secondary">
                {subtitle}
            </Text>
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
            <Text typo="body 2">{children}</Text>
        </div>
    );
}

const useStyles = tss
    .withName({ CustomProviderFormSections: FormSection })
    .create(({ theme }) => ({
        section: {
            paddingBottom: theme.spacing(4),
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            "& + &": {
                marginTop: theme.spacing(4)
            },
            "&:last-child": {
                borderBottom: "none",
                paddingBottom: 0
            }
        },
        fields: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3),
            marginTop: theme.spacing(4)
        },
        verificationHeadingRow: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing(2),
            marginBottom: theme.spacing(5)
        },
        testButton: {
            flex: "none"
        },
        testingMessage: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            minHeight: 40,
            marginTop: theme.spacing(2),
            paddingLeft: theme.spacing(2)
        }
    }));

const useStyles_SectionHeading = tss.withName({ SectionHeading }).create(({ theme }) => ({
    root: {
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5)
    }
}));

const useStyles_StatusMessage = tss.withName({ StatusMessage }).create(({ theme }) => ({
    root: {
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        marginTop: theme.spacing(2),
        padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
        borderRadius: 8,
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
        width: 16,
        height: 16,
        borderRadius: "50%"
    },
    dotSuccess: {
        backgroundColor: theme.colors.useCases.alertSeverity.success.main
    },
    dotError: {
        backgroundColor: theme.colors.useCases.alertSeverity.error.main
    }
}));
