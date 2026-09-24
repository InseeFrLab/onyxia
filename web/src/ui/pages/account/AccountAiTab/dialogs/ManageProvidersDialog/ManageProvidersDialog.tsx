import { Alert, Link, MenuItem, Select } from "@mui/material";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { declareComponentKeys, useResolveLocalizedString, useTranslation } from "ui/i18n";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { ModelsSelection } from "../../shared/ModelsSelection";
import { ProviderValueField } from "./ProviderValueField";
import { ProviderStateChip, type ProviderState } from "../../ProviderCard";
import { ProviderSection } from "../CustomProviderFormDialog/FormSections";
import { SideDialog } from "../../shared/SideDialog";

export type ManagedProvider = {
    name: string;
    subtitle: string;
    state: ProviderState;
    /** Only for the providers created by the user, which can be redefined */
    configuration:
        | {
              name: string;
              providerType: AiConfig.SupportedAiProviderType | undefined;
              supportedProviderTypes: readonly AiConfig.SupportedAiProviderType[];
              nameError: string | undefined;
          }
        | undefined;
    apiBase: string;
    isApiBaseEditable: boolean;
    apiBaseError: string | undefined;
    apiKey: string | undefined;
    isApiKeyEditable: boolean;
    /** undefined as long as the connection hasn't been successfully tested */
    availableModels: string[] | undefined;
    selectedModelIds: string[];
    isModelSelectionDisabled: boolean;
    connectionError: string | undefined;
    canTestConnection: boolean;
    isTestingConnection: boolean;
    canRefreshCredentials: boolean;
    isRefreshingCredentials: boolean;
    canSave: boolean;
    canDelete: boolean;
    /** Written by the admin in the instance configuration */
    documentation: AiConfig.Documentation | undefined;
};

/** Nothing is saved before `onSave`: the edits are held by the caller until then. */
export function ManageProvidersDialog(props: {
    providerNames: string[];
    provider: ManagedProvider;
    onProviderChange: (providerName: string) => void;
    onClose: () => void;
    onNameChange: (name: string) => void;
    onProviderTypeChange: (providerType: AiConfig.SupportedAiProviderType) => void;
    onApiBaseChange: (apiBase: string) => void;
    onApiKeyChange: (apiKey: string) => void;
    onSelectedModelsChange: (modelIds: string[]) => void;
    onRefreshCredentials: () => void | Promise<void>;
    onTestConnection: () => void | Promise<void>;
    onSave: () => void | Promise<void>;
    onDelete: () => void | Promise<void>;
}) {
    const { t } = useTranslation({ ManageProvidersDialog });
    const { classes, cx } = useStyles();
    const { resolveLocalizedString } = useResolveLocalizedString();
    const { provider } = props;

    const onClose = props.onClose;

    return (
        <SideDialog
            title={t("dialog title")}
            closeLabel={t("close aria label")}
            onClose={onClose}
        >
            <div className={classes.root}>
                <div className={classes.providerHeader}>
                    <Select
                        className={classes.providerSelect}
                        value={provider.name}
                        variant="standard"
                        disableUnderline
                        inputProps={{ "aria-label": t("provider selector aria label") }}
                        onChange={event => props.onProviderChange(event.target.value)}
                    >
                        {props.providerNames.map(providerName => (
                            <MenuItem key={providerName} value={providerName}>
                                {providerName}
                            </MenuItem>
                        ))}
                    </Select>
                    <Text typo="body 1" className={classes.providerSubtitle}>
                        {provider.subtitle}
                    </Text>
                    {provider.canDelete && (
                        <Button
                            variant="ternary"
                            className={classes.deleteButton}
                            startIcon={getIconUrlByName("Delete")}
                            onClick={props.onDelete}
                        >
                            {t("delete provider")}
                        </Button>
                    )}
                </div>

                <div className={classes.scrollableContent}>
                    {provider.configuration !== undefined && (
                        <ProviderSection
                            name={provider.configuration.name}
                            protocol={provider.configuration.providerType ?? ""}
                            supportedProtocols={
                                provider.configuration.supportedProviderTypes
                            }
                            onNameChange={props.onNameChange}
                            onProtocolChange={props.onProviderTypeChange}
                            nameError={provider.configuration.nameError}
                        />
                    )}
                    <section className={classes.section}>
                        <div className={classes.sectionHeading}>
                            <div className={classes.sectionTitle}>
                                <Text typo="object heading">
                                    {t("connection details title")}
                                </Text>
                                <ProviderStateChip state={provider.state} />
                            </div>
                            <Text typo="body 1" className={classes.sectionHelper}>
                                {t("connection details helper")}
                            </Text>
                        </div>
                        <div className={classes.fields}>
                            <ProviderValueField
                                label={t("api base url")}
                                value={provider.apiBase}
                                onChange={
                                    provider.isApiBaseEditable
                                        ? props.onApiBaseChange
                                        : undefined
                                }
                                errorMessage={provider.apiBaseError}
                                onRequestCopy={() => copyToClipboard(provider.apiBase)}
                            />
                            {(provider.apiKey !== undefined ||
                                provider.isApiKeyEditable) && (
                                <ProviderValueField
                                    label={t("api key")}
                                    value={provider.apiKey ?? ""}
                                    isSensitiveInformation
                                    onChange={
                                        provider.isApiKeyEditable
                                            ? props.onApiKeyChange
                                            : undefined
                                    }
                                    disabled={provider.isRefreshingCredentials}
                                    onRequestCopy={() =>
                                        copyToClipboard(provider.apiKey ?? "")
                                    }
                                />
                            )}
                        </div>
                        {provider.connectionError !== undefined && (
                            <Alert severity="warning">{provider.connectionError}</Alert>
                        )}
                        <div className={classes.sectionActions}>
                            {/* NOTE: Only for the OIDC token exchange authentication */}
                            {provider.canRefreshCredentials && (
                                <Button
                                    variant="ternary"
                                    className={classes.refreshCredentialsButton}
                                    startIcon={getIconUrlByName("Refresh")}
                                    disabled={provider.isRefreshingCredentials}
                                    onClick={props.onRefreshCredentials}
                                >
                                    {t("refresh credentials")}
                                </Button>
                            )}
                            <Button
                                variant="ternary"
                                className={cx(
                                    classes.testConnectionButton,
                                    provider.isTestingConnection &&
                                        classes.testConnectionButton_testing
                                )}
                                startIcon={
                                    provider.isTestingConnection
                                        ? undefined
                                        : getIconUrlByName("NetworkCheck")
                                }
                                disabled={
                                    !provider.canTestConnection ||
                                    provider.isRefreshingCredentials
                                }
                                onClick={props.onTestConnection}
                            >
                                {provider.isTestingConnection && (
                                    <CircularProgress
                                        className={classes.testConnectionLoader}
                                        size={16}
                                    />
                                )}
                                {t("test connection")}
                            </Button>
                        </div>
                    </section>

                    <section className={classes.section}>
                        <div className={classes.sectionHeading}>
                            <Text typo="object heading">{t("manage models title")}</Text>
                            <Text typo="body 1" className={classes.sectionHelper}>
                                {t("manage models helper")}
                            </Text>
                        </div>
                        <ModelsSelection
                            models={provider.availableModels ?? []}
                            selectedModels={provider.selectedModelIds}
                            disabled={provider.isModelSelectionDisabled}
                            onSelectedModelsChange={props.onSelectedModelsChange}
                        />
                    </section>
                    {provider.documentation !== undefined && (
                        <section
                            className={cx(classes.section, classes.documentationSection)}
                        >
                            <div className={classes.sectionHeading}>
                                <Text typo="object heading">
                                    {t("documentation title")}
                                </Text>
                                <Text typo="body 1" className={classes.sectionHelper}>
                                    {resolveLocalizedString(
                                        provider.documentation.mainText
                                    )}
                                </Text>
                            </div>
                            {provider.documentation.links.length !== 0 && (
                                <div className={classes.documentationLinks}>
                                    {provider.documentation.links.map(link => (
                                        <Link
                                            key={link.url}
                                            className={classes.documentationLink}
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            underline="none"
                                        >
                                            <span
                                                className={classes.documentationLinkLabel}
                                            >
                                                {resolveLocalizedString(link.label)}
                                            </span>
                                            <Icon
                                                icon={getIconUrlByName("OpenInNew")}
                                                size="extra small"
                                            />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <div className={classes.footer}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button
                        disabled={!provider.canSave || provider.isRefreshingCredentials}
                        onClick={props.onSave}
                    >
                        {t("save changes")}
                    </Button>
                </div>
            </div>
        </SideDialog>
    );
}

/** Below this width, the provider header stacks its content */
const narrowDialogWidth = 480;

const useStyles = tss.withName({ ManageProvidersDialog }).create(({ theme }) => ({
    // The header adapts to the width of the dialog, not to the one of the window
    root: {
        containerType: "inline-size",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column"
    },
    providerHeader: {
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        paddingBottom: theme.spacing(3),
        [`@container (max-width: ${narrowDialogWidth}px)`]: {
            alignItems: "flex-start",
            flexDirection: "column"
        }
    },
    providerSelect: {
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary,
        ...theme.typography.variants["object heading"].style,
        // NOTE: As specific as MUI's rule, which reserves room for the icon
        "& .MuiSelect-select.MuiInputBase-input": {
            padding: 0,
            paddingRight: theme.spacing(4)
        }
    },
    deleteButton: {
        flex: "none",
        borderWidth: 0,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textPrimary
    },
    providerSubtitle: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        color: theme.colors.useCases.typography.textSecondary,
        textAlign: "right",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        [`@container (max-width: ${narrowDialogWidth}px)`]: {
            textAlign: "left"
        }
    },
    scrollableContent: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
        overflowY: "auto",
        paddingBottom: theme.spacing(3)
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3)
    },
    sectionHeading: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5)
    },
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2)
    },
    sectionHelper: {
        color: theme.colors.useCases.typography.textSecondary
    },
    documentationSection: {
        paddingTop: theme.spacing(4),
        borderTop: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    documentationLinks: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: theme.spacing(2)
    },
    documentationLink: {
        maxWidth: "100%",
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
        borderRadius: theme.spacing(1),
        backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1,
        color: theme.colors.useCases.typography.textFocus,
        ...theme.typography.variants["caption"].style,
        fontWeight: 500,
        "& svg, & img": {
            flexShrink: 0
        }
    },
    documentationLinkLabel: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    fields: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2)
    },
    sectionActions: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: theme.spacing(2)
    },
    refreshCredentialsButton: {
        borderWidth: 0,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textPrimary
    },
    // Figma's `surface-action-secondary`: the inverse of the current surface
    testConnectionButton: {
        borderWidth: 0,
        backgroundColor: theme.colors.useCases.typography.textPrimary,
        color: theme.colors.useCases.surfaces.background,
        "&:hover": {
            backgroundColor: theme.colors.useCases.typography.textPrimary,
            color: theme.colors.useCases.surfaces.background
        },
        "&.Mui-disabled": {
            backgroundColor: theme.colors.useCases.typography.textPrimary,
            color: theme.colors.useCases.surfaces.background,
            opacity: 0.3
        }
    },
    // Disabled while testing, but not faded out: the loader has to stay visible
    testConnectionButton_testing: {
        "&.Mui-disabled": {
            opacity: 1
        }
    },
    testConnectionLoader: {
        marginRight: theme.spacing(2),
        "&&": {
            color: "inherit"
        }
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

const { i18n } = declareComponentKeys<
    | "dialog title"
    | "close aria label"
    | "provider selector aria label"
    | "documentation title"
    | "connection details title"
    | "connection details helper"
    | "manage models title"
    | "manage models helper"
    | "api base url"
    | "api key"
    | "refresh credentials"
    | "test connection"
    | "delete provider"
    | "cancel"
    | "save changes"
>()({ ManageProvidersDialog });
export type I18n = typeof i18n;
