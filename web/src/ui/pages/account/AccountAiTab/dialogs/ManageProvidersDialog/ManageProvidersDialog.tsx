import { Link, MenuItem, Select } from "@mui/material";
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
import { ProviderStateChip } from "../../ProviderCard";
import { ProviderSection } from "../CustomProviderFormDialog/FormSections";
import { SideDialog } from "../../shared/SideDialog";
import { AiAlert } from "../../shared/AiAlert";
import {
    ConfirmCustomProviderDeletionDialog,
    type Props as ConfirmProps
} from "../ConfirmCustomProviderDeletionDialog";
import { memo } from "react";
import { useCoreState, getCoreSync } from "core";
import type { ManageDialogView } from "core/usecases/aiProviderFormUiController";
import { Evt, type UnpackEvt } from "evt";
import { Deferred } from "evt/tools/Deferred";
import { useConst } from "powerhooks/useConst";

/** Existing providers, whatever their origin. The ones being created have their own dialog. */
export const ManageProvidersDialog = memo(() => {
    const view = useCoreState("aiProviderFormUiController", "manageDialog");

    const {
        functions: { aiProviderFormUiController: form }
    } = getCoreSync();

    const evtConfirmDeletion = useConst(() =>
        Evt.create<UnpackEvt<ConfirmProps["evtOpen"]>>()
    );

    return (
        <>
            {view.isOpen && (
                <ManageProvidersDialogView
                    view={view}
                    onProviderChange={providerName => form.open({ providerName })}
                    onClose={form.close}
                    onNameChange={name => form.changeValue({ key: "name", value: name })}
                    onProviderTypeChange={providerType =>
                        form.changeProviderType({ providerType })
                    }
                    onApiBaseChange={apiBase =>
                        form.changeValue({ key: "apiBase", value: apiBase })
                    }
                    onApiKeyChange={apiKey =>
                        form.changeValue({ key: "apiKey", value: apiKey })
                    }
                    onSelectedModelsChange={selectedModelIds =>
                        form.changeSelectedModelIds({ selectedModelIds })
                    }
                    onRefreshCredentials={form.refreshCredentials}
                    onTestConnection={form.testConnection}
                    onSave={form.submit}
                    onDelete={async () => {
                        const confirmation = new Deferred<boolean>();

                        evtConfirmDeletion.post({
                            resolveDoProceed: confirmation.resolve
                        });

                        if (!(await confirmation.pr)) {
                            return;
                        }

                        await form.deleteProvider();
                    }}
                />
            )}
            <ConfirmCustomProviderDeletionDialog evtOpen={evtConfirmDeletion} />
        </>
    );
});

/** Nothing is saved before `onSave`, except the models when they are the saved ones. */
export function ManageProvidersDialogView(props: {
    view: ManageDialogView.Open;
    onProviderChange: (providerName: string) => void;
    onClose: () => void;
    onNameChange: (name: string) => void;
    onProviderTypeChange: (providerType: AiConfig.SupportedAiProviderType) => void;
    onApiBaseChange: (apiBase: string) => void;
    onApiKeyChange: (apiKey: string) => void;
    onSelectedModelsChange: (modelIds: string[]) => void;
    onRefreshCredentials: () => void;
    onTestConnection: () => void;
    onSave: () => void;
    onDelete: () => void;
}) {
    const { view, onClose } = props;

    const { t } = useTranslation({ ManageProvidersDialog });
    const { t: tAccount } = useTranslation("AccountAiTab");
    const { t: tForm } = useTranslation("CustomProviderFormDialog");
    const { classes, cx } = useStyles();
    const { resolveLocalizedString } = useResolveLocalizedString();

    const isRefreshingCredentials = view.credentialsRefresh?.isRefreshing ?? false;

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
                        value={view.providerName}
                        variant="standard"
                        disableUnderline
                        inputProps={{ "aria-label": t("provider selector aria label") }}
                        onChange={event => props.onProviderChange(event.target.value)}
                    >
                        {view.providerNames.map(providerName => (
                            <MenuItem key={providerName} value={providerName}>
                                {providerName}
                            </MenuItem>
                        ))}
                    </Select>
                    <Text typo="body 1" className={classes.providerSubtitle}>
                        {view.origin === "configured by admin"
                            ? tAccount("provided by organization")
                            : tAccount("custom providers section title")}
                    </Text>
                    {view.canDelete && (
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
                    {view.configuration !== undefined && (
                        <ProviderSection
                            name={view.configuration.name.value}
                            protocol={view.configuration.providerType.value ?? ""}
                            supportedProtocols={view.configuration.providerType.options}
                            onNameChange={props.onNameChange}
                            onProtocolChange={props.onProviderTypeChange}
                            nameError={
                                view.configuration.name.isInvalid
                                    ? tForm("invalid name")
                                    : undefined
                            }
                        />
                    )}
                    <section className={classes.section}>
                        <div className={classes.sectionHeading}>
                            <div className={classes.sectionTitle}>
                                <Text typo="object heading">
                                    {t("connection details title")}
                                </Text>
                                <ProviderStateChip state={view.connectionState} />
                            </div>
                            <Text typo="body 1" className={classes.sectionHelper}>
                                {t("connection details helper")}
                            </Text>
                        </div>
                        <div className={classes.fields}>
                            <ProviderValueField
                                label={t("api base url")}
                                value={view.apiBase.value}
                                onChange={
                                    view.apiBase.isEditable
                                        ? props.onApiBaseChange
                                        : undefined
                                }
                                errorMessage={
                                    view.apiBase.isInvalid
                                        ? tForm("invalid api base")
                                        : undefined
                                }
                                onRequestCopy={() => copyToClipboard(view.apiBase.value)}
                            />
                            {view.apiKey !== undefined && (
                                <ProviderValueField
                                    label={t("api key")}
                                    value={view.apiKey.value}
                                    isSensitiveInformation
                                    onChange={
                                        view.apiKey.isEditable
                                            ? props.onApiKeyChange
                                            : undefined
                                    }
                                    disabled={isRefreshingCredentials}
                                    onRequestCopy={() =>
                                        copyToClipboard(view.apiKey?.value ?? "")
                                    }
                                />
                            )}
                        </div>
                        {view.alert !== undefined && (
                            <AiAlert
                                title={t(view.alert)}
                                message={t(`${view.alert} details`)}
                            />
                        )}
                        <div className={classes.sectionActions}>
                            {/* NOTE: Only for the OIDC token exchange authentication */}
                            {view.credentialsRefresh !== undefined && (
                                <Button
                                    variant="ternary"
                                    className={classes.refreshCredentialsButton}
                                    startIcon={getIconUrlByName("Refresh")}
                                    disabled={isRefreshingCredentials}
                                    onClick={props.onRefreshCredentials}
                                >
                                    {t("refresh credentials")}
                                </Button>
                            )}
                            <Button
                                variant="ternary"
                                className={cx(
                                    classes.testConnectionButton,
                                    view.connectionTest.isTesting &&
                                        classes.testConnectionButton_testing
                                )}
                                startIcon={
                                    view.connectionTest.isTesting
                                        ? undefined
                                        : getIconUrlByName("NetworkCheck")
                                }
                                disabled={!view.connectionTest.canTest}
                                onClick={props.onTestConnection}
                            >
                                {view.connectionTest.isTesting && (
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
                            models={view.models.available}
                            selectedModels={view.models.selected}
                            disabled={view.models.isDisabled}
                            onSelectedModelsChange={props.onSelectedModelsChange}
                        />
                    </section>
                    {view.documentation !== undefined && (
                        <section
                            className={cx(classes.section, classes.documentationSection)}
                        >
                            <div className={classes.sectionHeading}>
                                <Text typo="object heading">
                                    {t("documentation title")}
                                </Text>
                                <Text typo="body 1" className={classes.sectionHelper}>
                                    {resolveLocalizedString(view.documentation.mainText)}
                                </Text>
                            </div>
                            {view.documentation.links.length !== 0 && (
                                <div className={classes.documentationLinks}>
                                    {view.documentation.links.map(link => (
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
                    <Button disabled={!view.canSave} onClick={props.onSave}>
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
    | "save failed"
    | "save failed details"
    | "api-key not provided"
    | "api-key not provided details"
    | "connection failed"
    | "connection failed details"
>()({ ManageProvidersDialog });
export type I18n = typeof i18n;
