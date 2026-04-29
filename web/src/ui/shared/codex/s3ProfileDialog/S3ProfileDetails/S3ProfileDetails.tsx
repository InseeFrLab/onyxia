import type {
    Technology,
    CodeSnippet
} from "core/usecases/s3ProfilesDetailsUiController/decoupledLogic/codeSnippets";
import { useId, type ReactNode } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { alpha } from "@mui/material/styles";
import { Button } from "onyxia-ui/Button";
import { CopyToClipboardIconButton } from "onyxia-ui/CopyToClipboardIconButton";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import {
    CodeTextEditor,
    type CodeTextEditorLanguage
} from "ui/shared/textEditor/CodeTextEditor";
import { assert } from "tsafe/assert";

export type Props = {
    className?: string;
    /** Assert at least one profile */
    availableProfileNames: string[];

    profileName: string;

    onSelectedProfileChange: (params: { profileName: string }) => void;

    onCreateNewProfile: () => void;

    onEdit: (() => void) | undefined;

    endpointUrl: string;
    defaultRegion: string | undefined;

    accessCredentials:
        | {
              expirationTime: number | undefined;
              accessKeyId: string;
              secretAccessKey: string;
              sessionToken: string | undefined;
              areTokensBeingRenewed: boolean;
              onRenewToken: (() => void) | undefined;
          }
        | undefined;

    availableTechnologies: readonly Technology[];
    technology: Technology;
    onTechnologyChange: (params: { technology: Technology }) => void;
    codeSnippet: CodeSnippet;
};

const createNewProfileSelectValue = "__onyxia_create_new_s3_profile__";

export function S3ProfileDetails(props: Props) {
    const {
        className,
        availableProfileNames,
        profileName,
        onSelectedProfileChange,
        onCreateNewProfile,
        onEdit,
        endpointUrl,
        defaultRegion,
        accessCredentials,
        availableTechnologies,
        technology,
        onTechnologyChange,
        codeSnippet
    } = props;

    const profileSelectLabelId = useId();
    const technologySelectLabelId = useId();

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.profileBar}>
                <FormControl variant="standard" className={classes.profileSelectControl}>
                    <InputLabel id={profileSelectLabelId}>Profile</InputLabel>
                    <Select
                        labelId={profileSelectLabelId}
                        value={profileName}
                        onChange={event => {
                            const { value } = event.target;
                            assert(typeof value === "string");

                            if (value === createNewProfileSelectValue) {
                                onCreateNewProfile();
                                return;
                            }

                            onSelectedProfileChange({ profileName: value });
                        }}
                    >
                        {availableProfileNames.map(availableProfileName => (
                            <MenuItem
                                key={availableProfileName}
                                value={availableProfileName}
                            >
                                {availableProfileName}
                            </MenuItem>
                        ))}
                        <MenuItem value={createNewProfileSelectValue}>
                            <span className={classes.createProfileMenuItem}>
                                <Icon icon={getIconUrlByName("Add")} size="extra small" />
                                New S3 Profile
                            </span>
                        </MenuItem>
                    </Select>
                </FormControl>

                <Button
                    className={classes.editButton}
                    variant="ternary"
                    startIcon={getIconUrlByName("Edit")}
                    disabled={onEdit === undefined}
                    onClick={onEdit}
                >
                    Edit
                </Button>
            </div>

            <section className={classes.section}>
                <SectionHeading
                    title="Connection details"
                    subtitle="Use these values when configuring S3 clients outside the explorer."
                />
                <div className={classes.fields}>
                    <CopyableField
                        label="Endpoint URL"
                        copyLabel="endpoint URL"
                        value={endpointUrl}
                    />
                    {defaultRegion !== undefined && defaultRegion !== "" && (
                        <CopyableField
                            label="Default region"
                            copyLabel="default region"
                            value={defaultRegion}
                        />
                    )}
                </div>
            </section>

            <section className={classes.section}>
                <SectionHeading
                    title="Access credentials"
                    subtitle={
                        accessCredentials === undefined
                            ? "This profile does not expose credentials. Use anonymous S3 access where the target bucket allows it."
                            : "Copy the value required by the client you are configuring."
                    }
                />

                {accessCredentials !== undefined && (
                    <>
                        <div className={classes.fields}>
                            <CopyableField
                                label="Access key ID"
                                copyLabel="access key ID"
                                value={accessCredentials.accessKeyId}
                                isSensitive={true}
                                helperText={
                                    <>
                                        Environment variable{" "}
                                        <code className={classes.envVarName}>
                                            AWS_ACCESS_KEY_ID
                                        </code>
                                    </>
                                }
                            />
                            <CopyableField
                                label="Secret access key"
                                copyLabel="secret access key"
                                value={accessCredentials.secretAccessKey}
                                isSensitive={true}
                                helperText={
                                    <>
                                        Environment variable{" "}
                                        <code className={classes.envVarName}>
                                            AWS_SECRET_ACCESS_KEY
                                        </code>
                                    </>
                                }
                            />
                            {accessCredentials.sessionToken !== undefined && (
                                <CopyableField
                                    label="Session token"
                                    copyLabel="session token"
                                    value={accessCredentials.sessionToken}
                                    isSensitive={true}
                                    helperText={
                                        <>
                                            Environment variable{" "}
                                            <code className={classes.envVarName}>
                                                AWS_SESSION_TOKEN
                                            </code>
                                        </>
                                    }
                                />
                            )}
                        </div>

                        <div className={classes.credentialsFooter}>
                            <Text typo="body 2" className={classes.credentialsExpiration}>
                                {accessCredentials.expirationTime === undefined
                                    ? "No expiration time is advertised for these credentials."
                                    : `Expires ${formatExpirationTime(
                                          accessCredentials.expirationTime
                                      )}.`}
                            </Text>
                            {accessCredentials.onRenewToken !== undefined && (
                                <Button
                                    variant="ternary"
                                    startIcon={getIconUrlByName("Refresh")}
                                    disabled={accessCredentials.areTokensBeingRenewed}
                                    onClick={accessCredentials.onRenewToken}
                                >
                                    {accessCredentials.areTokensBeingRenewed
                                        ? "Renewing..."
                                        : "Renew tokens"}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </section>

            <section className={classes.section}>
                <SectionHeading
                    title="Setup snippet"
                    subtitle="Select a target environment and copy the generated configuration snippet."
                />

                <div className={classes.snippetToolbar}>
                    <FormControl
                        variant="standard"
                        className={classes.technologySelectControl}
                    >
                        <InputLabel id={technologySelectLabelId}>Technology</InputLabel>
                        <Select
                            labelId={technologySelectLabelId}
                            value={technology}
                            onChange={event => {
                                const { value } = event.target;
                                assert(typeof value === "string");

                                if (!isTechnology(value, availableTechnologies)) {
                                    return;
                                }

                                onTechnologyChange({ technology: value });
                            }}
                        >
                            {availableTechnologies.map(availableTechnology => (
                                <MenuItem
                                    key={availableTechnology}
                                    value={availableTechnology}
                                >
                                    {availableTechnology}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <div className={classes.snippetActions}>
                        <span
                            className={classes.fileBasename}
                            title={codeSnippet.fileBasename}
                        >
                            {codeSnippet.fileBasename}
                        </span>
                        <CopyToClipboardIconButton
                            textToCopy={codeSnippet.codeSrc}
                            copyToClipboardText="Copy code snippet to clipboard"
                            copiedToClipboardText="Code snippet copied to clipboard"
                        />
                    </div>
                </div>

                <CodeTextEditor
                    className={classes.codeEditor}
                    value={codeSnippet.codeSrc}
                    onChange={undefined}
                    language={getCodeTextEditorLanguage(technology)}
                    maxHeight={360}
                    fallback={<div className={classes.editorFallback} />}
                />
            </section>
        </div>
    );
}

function SectionHeading(props: { title: string; subtitle: ReactNode }) {
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

function CopyableField(props: {
    label: string;
    copyLabel: string;
    value: string;
    helperText?: ReactNode;
    isSensitive?: boolean;
}) {
    const { label, copyLabel, value, helperText, isSensitive = false } = props;

    const { classes, cx } = useStyles_CopyableField();
    const displayedValue = isSensitive ? getMiddleEllipsis(value) : value;

    return (
        <div className={classes.root}>
            <div className={classes.header}>
                <Text typo="label 1" className={classes.label}>
                    {label}
                </Text>
                <div className={classes.valueAndCopy}>
                    <span
                        className={cx(
                            classes.value,
                            isSensitive && classes.sensitiveValue
                        )}
                        title={isSensitive ? displayedValue : value}
                    >
                        {displayedValue}
                    </span>
                    <CopyToClipboardIconButton
                        textToCopy={value}
                        copyToClipboardText={`Copy ${copyLabel} to clipboard`}
                        copiedToClipboardText={`${label} copied to clipboard`}
                    />
                </div>
            </div>
            {helperText !== undefined && (
                <Text typo="body 2" className={classes.helperText}>
                    {helperText}
                </Text>
            )}
        </div>
    );
}

function getMiddleEllipsis(value: string): string {
    const length = 28;

    if (value.length <= length) {
        return value;
    }

    const prefixLength = 12;
    const suffixLength = 8;

    return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`;
}

function formatExpirationTime(expirationTime: number): string {
    if (!Number.isFinite(expirationTime)) {
        return "never";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(expirationTime));
}

function isTechnology(
    value: string,
    availableTechnologies: readonly Technology[]
): value is Technology {
    return (availableTechnologies as readonly string[]).includes(value);
}

function getCodeTextEditorLanguage(technology: Technology): CodeTextEditorLanguage {
    switch (technology) {
        case "AWS CLI / shared profile":
            return "shell";
        case "Python (boto3)":
        case "Python (s3fs)":
        case "Python (polars)":
        case "Python (pyarrow)":
            return "python";
        case "DuckDB":
            return "SQL";
        case "R (arrow)":
        case "R (paws)":
            return "R";
        case "rclone":
            return "properties";
    }
}

const useStyles = tss.withName({ S3ProfileDetails }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
        minWidth: 0
    },
    profileBar: {
        display: "flex",
        alignItems: "flex-end",
        gap: theme.spacing(2),
        minWidth: 0
    },
    profileSelectControl: {
        flex: 1,
        minWidth: 0
    },
    editButton: {
        flex: "none"
    },
    createProfileMenuItem: {
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1)
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
        minWidth: 0
    },
    fields: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1.5),
        minWidth: 0
    },
    envVarName: {
        color: theme.colors.useCases.typography.textFocus,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "0.92em"
    },
    credentialsFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        flexWrap: "wrap",
        minWidth: 0
    },
    credentialsExpiration: {
        color: theme.colors.useCases.typography.textSecondary,
        minWidth: 0
    },
    snippetToolbar: {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        flexWrap: "wrap",
        minWidth: 0
    },
    technologySelectControl: {
        flex: "1 1 230px",
        minWidth: 0
    },
    snippetActions: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: theme.spacing(1),
        minWidth: 0,
        flex: "1 1 120px"
    },
    fileBasename: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: theme.colors.useCases.typography.textSecondary,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 13
    },
    codeEditor: {
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        boxSizing: "border-box"
    },
    editorFallback: {
        height: 220,
        borderRadius: theme.spacing(1),
        backgroundColor: theme.colors.useCases.surfaces.surface2
    }
}));

const useStyles_SectionHeading = tss.withName({ SectionHeading }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.75),
        minWidth: 0
    },
    title: {
        color: theme.colors.useCases.typography.textPrimary
    },
    subtitle: {
        color: theme.colors.useCases.typography.textSecondary
    }
}));

const useStyles_CopyableField = tss.withName({ CopyableField }).create(({ theme }) => ({
    root: {
        padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
        borderRadius: 8,
        backgroundColor: alpha(theme.colors.useCases.surfaces.surface2, 0.72),
        minWidth: 0
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        flexWrap: "wrap",
        minWidth: 0
    },
    label: {
        color: theme.colors.useCases.typography.textPrimary,
        minWidth: 0
    },
    valueAndCopy: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: theme.spacing(1),
        flex: "1 1 180px",
        minWidth: 0
    },
    value: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: theme.colors.useCases.typography.textPrimary,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 13,
        textAlign: "right"
    },
    sensitiveValue: {
        letterSpacing: 0
    },
    helperText: {
        marginTop: theme.spacing(0.75),
        color: theme.colors.useCases.typography.textSecondary
    }
}));
