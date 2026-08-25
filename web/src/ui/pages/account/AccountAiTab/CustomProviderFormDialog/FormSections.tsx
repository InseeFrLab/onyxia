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
            headingTypo="section heading"
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
    headingTypo?: "section heading" | "object heading";
    action?: ReactNode;
    children: ReactNode;
}) {
    const { title, subtitle, headingTypo = "object heading", action, children } = props;
    const { classes, cx } = useStyles();

    return (
        <section className={classes.section}>
            <div className={classes.headingRow}>
                <SectionHeading
                    title={title}
                    subtitle={subtitle}
                    headingTypo={headingTypo}
                />
                {action}
            </div>
            <div
                className={cx(
                    classes.fields,
                    action !== undefined && classes.verificationFields
                )}
            >
                {children}
            </div>
        </section>
    );
}

function SectionHeading(props: {
    title: string;
    subtitle: string;
    headingTypo: "section heading" | "object heading";
}) {
    const { title, subtitle, headingTypo } = props;
    const { classes } = useStyles_SectionHeading();

    return (
        <div className={classes.root}>
            <Text typo={headingTypo}>{title}</Text>
            <Text typo="body 1" color="secondary">
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
            gap: theme.spacing(4),
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
        verificationFields: {
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
            backgroundColor: theme.colors.palette.dark.light,
            color: theme.colors.useCases.surfaces.background,
            "& .MuiButton-startIcon": {
                marginLeft: 0,
                marginRight: theme.spacing(1)
            },
            "& .MuiButton-startIcon > *": {
                width: theme.spacing(3),
                height: theme.spacing(3)
            },
            "&.Mui-disabled": {
                backgroundColor: theme.colors.palette.dark.light,
                color: theme.colors.useCases.surfaces.background,
                opacity: 0.3
            }
        },
        testingMessage: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 40,
            padding: `${theme.spacing(2)}px ${theme.spacing(3)}px`,
            borderRadius: theme.spacing(2),
            boxSizing: "border-box",
            backgroundColor: theme.colors.useCases.surfaces.surface2
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
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        gap: 10,
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
