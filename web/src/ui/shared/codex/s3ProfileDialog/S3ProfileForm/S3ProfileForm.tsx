import { useEffect, useId, useState, type ReactNode } from "react";
import Input from "@mui/material/Input";
import Radio from "@mui/material/Radio";
import Switch from "@mui/material/Switch";
import { alpha } from "@mui/material/styles";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { tss } from "tss";

export type ErrorId =
    | "must be an url"
    | "is required"
    | "not a valid access key id"
    | "profile name already used";

export type Props = {
    className?: string;

    // If true, the submit button should be labeled "Save Configuration" else "Create Profile"
    isEditionOfAnExistingConfig: boolean;

    profileName: {
        value: string;
        onChange: (newValue: string) => void;
        errorMessage: ErrorId | undefined;
    };

    endpointUrl: {
        value: string;
        onChange: (newValue: string) => void;
        errorMessage: ErrorId | undefined;
    };

    defaultRegion: {
        value: string | undefined;
        onChange: (newValue: string | undefined) => void;
        errorMessage: ErrorId | undefined;
    };

    urlStyle: {
        value: "path" | "virtual-hosted";
        onChange: (newValue: "path" | "virtual-hosted") => void;
    };

    isAnonymous: {
        value: boolean;
        onChange: (newValue: boolean) => void;
    };

    accessKeyId: {
        value: string | undefined;
        onChange: (newValue: string | undefined) => void;
        errorMessage: ErrorId | undefined;
    };

    secretAccessKey: {
        value: string | undefined;
        onChange: (newValue: string | undefined) => void;
        errorMessage: ErrorId | undefined;
    };

    sessionToken: {
        value: string | undefined;
        onChange: (newValue: string | undefined) => void;
        errorMessage: ErrorId | undefined;
    };

    onSubmit: (() => void) | undefined;

    onCancel: () => void;
};

type UrlStyle = Props["urlStyle"]["value"];
type FieldName =
    | "profileName"
    | "endpointUrl"
    | "defaultRegion"
    | "accessKeyId"
    | "secretAccessKey"
    | "sessionToken";

const fieldNames = [
    "profileName",
    "endpointUrl",
    "defaultRegion",
    "accessKeyId",
    "secretAccessKey",
    "sessionToken"
] as const satisfies readonly FieldName[];

export function S3ProfileForm(props: Props) {
    const {
        className,
        isEditionOfAnExistingConfig,
        profileName,
        endpointUrl,
        defaultRegion,
        urlStyle,
        isAnonymous,
        accessKeyId,
        secretAccessKey,
        sessionToken,
        onSubmit,
        onCancel
    } = props;

    const { t } = useTranslation({ S3ProfileForm });
    const { classes, cx } = useStyles();

    const [fieldsThatLostFocus, setFieldsThatLostFocus] = useState<
        Record<FieldName, boolean>
    >(() => getInitialFieldsThatLostFocus());
    const [hasSubmittedInvalidForm, setHasSubmittedInvalidForm] = useState(false);

    useEffect(() => {
        if (onSubmit === undefined) {
            return;
        }

        setHasSubmittedInvalidForm(false);
    }, [onSubmit]);

    const getIsFieldErrorVisible = (fieldName: FieldName) =>
        hasSubmittedInvalidForm || fieldsThatLostFocus[fieldName];

    const urlStyleExamples = getUrlStyleExamples({
        endpointUrl: endpointUrl.value,
        endpointUrlError: endpointUrl.errorMessage
    });

    const onFieldBlur = (fieldName: FieldName) =>
        setFieldsThatLostFocus(fieldsThatLostFocus => ({
            ...fieldsThatLostFocus,
            [fieldName]: true
        }));

    return (
        <form
            className={cx(classes.root, className)}
            onSubmit={event => {
                event.preventDefault();

                if (onSubmit === undefined) {
                    setHasSubmittedInvalidForm(true);
                    setFieldsThatLostFocus(getAllFieldsThatLostFocus());
                    return;
                }

                onSubmit();
            }}
            noValidate={true}
        >
            <div className={classes.body}>
                <FormTextField
                    label="Profile name"
                    value={profileName.value}
                    onChange={profileName.onChange}
                    onBlur={() => onFieldBlur("profileName")}
                    error={toErrorMessage({
                        errorId: profileName.errorMessage,
                        t
                    })}
                    isErrorVisible={getIsFieldErrorVisible("profileName")}
                    autoComplete="off"
                />

                <FormTextField
                    label="URL of the S3 service"
                    value={endpointUrl.value}
                    onChange={endpointUrl.onChange}
                    onBlur={() => onFieldBlur("endpointUrl")}
                    error={toErrorMessage({
                        errorId: endpointUrl.errorMessage,
                        t
                    })}
                    isErrorVisible={getIsFieldErrorVisible("endpointUrl")}
                    helperText="Example: https://minio.lab.example.net"
                    autoComplete="url"
                />

                <FormTextField
                    label="Default region"
                    value={defaultRegion.value ?? ""}
                    onChange={newValue =>
                        defaultRegion.onChange(emptyStringAsUndefined(newValue))
                    }
                    onBlur={() => onFieldBlur("defaultRegion")}
                    error={toErrorMessage({
                        errorId: defaultRegion.errorMessage,
                        t
                    })}
                    isErrorVisible={getIsFieldErrorVisible("defaultRegion")}
                    helperText="Example: eu-west-1, if not sure, leave empty"
                    autoComplete="off"
                />

                <Section>
                    <SectionHeading
                        title="URL style"
                        subtitle="Specify how your S3 server formats the URL for downloading files."
                    />

                    <div className={classes.urlStyleOptions}>
                        <UrlStyleOption
                            value="path"
                            selectedValue={urlStyle.value}
                            onChange={urlStyle.onChange}
                            title="Path style"
                            example={urlStyleExamples.path}
                        />
                        <UrlStyleOption
                            value="virtual-hosted"
                            selectedValue={urlStyle.value}
                            onChange={urlStyle.onChange}
                            title="Virtual-hosted style"
                            example={urlStyleExamples["virtual-hosted"]}
                        />
                    </div>
                </Section>

                <Section>
                    <Text typo="section heading" className={classes.credentialsTitle}>
                        Account Credentials
                    </Text>

                    <label className={classes.switchRow}>
                        <Switch
                            checked={isAnonymous.value}
                            onChange={event => isAnonymous.onChange(event.target.checked)}
                        />
                        <Text typo="body 1" className={classes.switchLabel}>
                            Anonymous access
                        </Text>
                    </label>

                    {!isAnonymous.value && (
                        <div className={classes.credentialsFields}>
                            <FormTextField
                                label="Access Key ID"
                                value={accessKeyId.value ?? ""}
                                onChange={newValue =>
                                    accessKeyId.onChange(emptyStringAsUndefined(newValue))
                                }
                                onBlur={() => onFieldBlur("accessKeyId")}
                                error={toErrorMessage({
                                    errorId: accessKeyId.errorMessage,
                                    t
                                })}
                                isErrorVisible={getIsFieldErrorVisible("accessKeyId")}
                                helperText="Example: ASIAIOSFODNN7EXAMPLE"
                                autoComplete="off"
                            />
                            <FormTextField
                                label="Secret Access Key"
                                value={secretAccessKey.value ?? ""}
                                onChange={newValue =>
                                    secretAccessKey.onChange(
                                        emptyStringAsUndefined(newValue)
                                    )
                                }
                                onBlur={() => onFieldBlur("secretAccessKey")}
                                error={toErrorMessage({
                                    errorId: secretAccessKey.errorMessage,
                                    t
                                })}
                                isErrorVisible={getIsFieldErrorVisible("secretAccessKey")}
                                helperText="Example: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                isSensitive={true}
                                autoComplete="off"
                            />
                            <FormTextField
                                label="Session Token"
                                value={sessionToken.value ?? ""}
                                onChange={newValue =>
                                    sessionToken.onChange(
                                        emptyStringAsUndefined(newValue)
                                    )
                                }
                                onBlur={() => onFieldBlur("sessionToken")}
                                error={toErrorMessage({
                                    errorId: sessionToken.errorMessage,
                                    t
                                })}
                                isErrorVisible={getIsFieldErrorVisible("sessionToken")}
                                helperText="Optional. Leave empty when your credentials do not include a session token."
                                isSensitive={true}
                                autoComplete="off"
                            />
                        </div>
                    )}
                </Section>
            </div>

            <div className={classes.actions}>
                <Button
                    variant="secondary"
                    onClick={event => {
                        event.preventDefault();
                        onCancel();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={onSubmit === undefined && hasSubmittedInvalidForm}
                >
                    {isEditionOfAnExistingConfig
                        ? "Save Configuration"
                        : "Create Profile"}
                </Button>
            </div>
        </form>
    );
}

function Section(props: { children: ReactNode }) {
    const { children } = props;
    const { classes } = useStyles_Section();

    return <section className={classes.root}>{children}</section>;
}

function SectionHeading(props: { title: string; subtitle: string }) {
    const { title, subtitle } = props;
    const { classes } = useStyles_SectionHeading();

    return (
        <div className={classes.root}>
            <Text typo="object heading" className={classes.title}>
                {title}
            </Text>
            <Text typo="body 2" className={classes.subtitle}>
                {subtitle}
            </Text>
        </div>
    );
}

function FormTextField(props: {
    label: string;
    value: string;
    onChange: (newValue: string) => void;
    onBlur: () => void;
    error: string | undefined;
    isErrorVisible: boolean;
    helperText?: string;
    isSensitive?: boolean;
    autoComplete: string;
}) {
    const {
        label,
        value,
        onChange,
        onBlur,
        error,
        isErrorVisible,
        helperText,
        isSensitive = false,
        autoComplete
    } = props;

    const inputId = useId();
    const helperTextId = useId();
    const { classes } = useStyles_FormTextField();
    const errorToDisplay = isErrorVisible ? error : undefined;

    return (
        <div className={classes.root}>
            <label htmlFor={inputId}>
                <Text typo="label 1" className={classes.label}>
                    {label}
                </Text>
            </label>
            <Input
                id={inputId}
                className={classes.input}
                value={value}
                onChange={event => onChange(event.target.value)}
                onBlur={onBlur}
                error={errorToDisplay !== undefined}
                type={isSensitive ? "password" : "text"}
                fullWidth={true}
                autoComplete={autoComplete}
                aria-describedby={
                    errorToDisplay !== undefined || helperText !== undefined
                        ? helperTextId
                        : undefined
                }
            />
            {(errorToDisplay !== undefined || helperText !== undefined) && (
                <Text
                    typo="body 2"
                    className={
                        errorToDisplay === undefined ? classes.helper : classes.error
                    }
                    componentProps={{ id: helperTextId }}
                >
                    {errorToDisplay ?? helperText}
                </Text>
            )}
        </div>
    );
}

function UrlStyleOption(props: {
    value: UrlStyle;
    selectedValue: UrlStyle;
    onChange: (newValue: UrlStyle) => void;
    title: string;
    example: string;
}) {
    const { value, selectedValue, onChange, title, example } = props;

    const id = useId();
    const isSelected = value === selectedValue;
    const { classes, cx } = useStyles_UrlStyleOption();

    return (
        <label
            htmlFor={id}
            className={cx(classes.root, isSelected && classes.rootSelected)}
        >
            <Radio
                id={id}
                className={classes.radio}
                checked={isSelected}
                onChange={() => onChange(value)}
                value={value}
                name="s3-url-style"
            />
            <span className={classes.text}>
                <Text typo="label 1" className={classes.title}>
                    {title}
                </Text>
                <Text typo="body 2" className={classes.example}>
                    Example: {example}
                </Text>
            </span>
        </label>
    );
}

function emptyStringAsUndefined(value: string): string | undefined {
    return value === "" ? undefined : value;
}

function getUrlStyleExamples(params: {
    endpointUrl: string;
    endpointUrlError: ErrorId | undefined;
}): Record<UrlStyle, string> {
    const { endpointUrl, endpointUrlError } = params;

    const endpoint = getEndpointForExample({
        endpointUrl,
        endpointUrlError
    });

    return {
        path: `${endpoint}/mybucket/prefix/my-dataset.parquet`,
        "virtual-hosted": `mybucket.${endpoint}/prefix/my-dataset.parquet`
    };
}

function getEndpointForExample(params: {
    endpointUrl: string;
    endpointUrlError: ErrorId | undefined;
}): string {
    const { endpointUrl, endpointUrlError } = params;

    fallback: {
        if (endpointUrlError !== undefined) {
            break fallback;
        }

        const trimmedEndpointUrl = endpointUrl.trim();

        if (trimmedEndpointUrl === "") {
            break fallback;
        }

        try {
            const url = new URL(
                trimmedEndpointUrl.startsWith("http")
                    ? trimmedEndpointUrl
                    : `https://${trimmedEndpointUrl}`
            );

            const pathname = url.pathname.replace(/^\/|\/$/g, "");

            return [url.host, pathname].filter(part => part !== "").join("/");
        } catch {
            break fallback;
        }
    }

    return "s3.my-domain.com";
}

function getInitialFieldsThatLostFocus(): Record<FieldName, boolean> {
    return Object.fromEntries(fieldNames.map(fieldName => [fieldName, false])) as Record<
        FieldName,
        boolean
    >;
}

function getAllFieldsThatLostFocus(): Record<FieldName, boolean> {
    return Object.fromEntries(fieldNames.map(fieldName => [fieldName, true])) as Record<
        FieldName,
        boolean
    >;
}

function toErrorMessage(params: {
    errorId: ErrorId | undefined;
    t: (key: ErrorId) => string;
}): string | undefined {
    const { errorId, t } = params;

    if (errorId === undefined) {
        return undefined;
    }

    return t(errorId);
}

const useStyles = tss.withName({ S3ProfileForm }).create(({ theme }) => ({
    root: {
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary
    },
    body: {
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        paddingRight: theme.spacing(0.5),
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3.5),
        minWidth: 0
    },
    urlStyleOptions: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1.5),
        minWidth: 0
    },
    credentialsTitle: {
        color: theme.colors.useCases.typography.textPrimary
    },
    switchRow: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        cursor: "pointer",
        width: "fit-content",
        maxWidth: "100%"
    },
    switchLabel: {
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary
    },
    credentialsFields: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        minWidth: 0
    },
    actions: {
        flex: "none",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: theme.spacing(2),
        paddingTop: theme.spacing(2.5),
        marginTop: theme.spacing(2),
        borderTop: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        backgroundColor: theme.colors.useCases.surfaces.surface1
    }
}));

const useStyles_Section = tss.withName({ Section }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
        minWidth: 0,
        paddingTop: theme.spacing(3),
        borderTop: `1px solid ${theme.colors.useCases.typography.textSecondary}`
    }
}));

const useStyles_SectionHeading = tss.withName({ SectionHeading }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5),
        minWidth: 0
    },
    title: {
        color: theme.colors.useCases.typography.textPrimary
    },
    subtitle: {
        color: theme.colors.useCases.typography.textSecondary
    }
}));

const useStyles_FormTextField = tss.withName({ FormTextField }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.75),
        minWidth: 0
    },
    label: {
        color: theme.colors.useCases.typography.textPrimary
    },
    input: {
        color: theme.colors.useCases.typography.textPrimary
    },
    helper: {
        color: theme.colors.useCases.typography.textSecondary
    },
    error: {
        color: theme.colors.useCases.alertSeverity.error.main
    }
}));

const useStyles_UrlStyleOption = tss.withName({ UrlStyleOption }).create(({ theme }) => ({
    root: {
        display: "flex",
        alignItems: "flex-start",
        gap: theme.spacing(1),
        minWidth: 0,
        padding: `${theme.spacing(1.75)}px ${theme.spacing(2)}px`,
        borderRadius: 8,
        border: `2px solid transparent`,
        backgroundColor: alpha(theme.colors.useCases.surfaces.surface2, 0.56),
        cursor: "pointer"
    },
    rootSelected: {
        borderColor: theme.colors.useCases.buttons.actionActive
    },
    radio: {
        flex: "none"
    },
    text: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.75),
        minWidth: 0,
        paddingTop: theme.spacing(0.75)
    },
    title: {
        color: theme.colors.useCases.typography.textPrimary
    },
    example: {
        color: theme.colors.useCases.typography.textSecondary,
        overflowWrap: "anywhere"
    }
}));

const { i18n } = declareComponentKeys<ErrorId>()({
    S3ProfileForm
});
export type I18n = typeof i18n;
