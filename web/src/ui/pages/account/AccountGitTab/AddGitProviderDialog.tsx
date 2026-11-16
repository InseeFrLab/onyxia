import { useId, useState, type FormEventHandler, type ReactNode } from "react";
import { Link } from "@mui/material";
import Divider from "@mui/material/Divider";
import Radio from "@mui/material/Radio";
import Switch from "@mui/material/Switch";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type {
    AddProviderDialogState,
    AddProviderError,
    ManageProviderDialogView,
    ManageProviderError
} from "core/usecases/gitAccountUiController";
import { SideDialog } from "ui/shared/SideDialog";
import { ErrorAlert } from "ui/shared/ErrorAlert";
import { FormTextField } from "ui/shared/FormFields";
import { defaultGitProviderLogoUrlByType } from "./defaultGitProviderLogoUrlByType";
import { TokenExpiration } from "./GitProviderCard";

type FormValues = {
    type: GitProvidersConfig.ProviderType;
    url: string;
    displayName: string;
    personalAccessToken: string;
};

type Props = {
    view: AddProviderDialogState;
    onClose: () => void;
    onSubmit: (params: {
        type: GitProvidersConfig.ProviderType;
        url: string;
        displayName: string;
        personalAccessToken: string;
    }) => void;
    getPersonalAccessTokenCreationUrl: (params: {
        type: GitProvidersConfig.ProviderType;
        url: string;
    }) => string | undefined;
};

const providerTypes = ["github", "gitlab", "forgejo", "bitbucket"] as const;

const providerNameByType: Record<GitProvidersConfig.ProviderType, string> = {
    github: "GitHub",
    gitlab: "GitLab",
    forgejo: "Forgejo",
    bitbucket: "Bitbucket"
};

/**
 * The public instance, undefined for Forgejo: it has none, the user always types
 * the url. Bitbucket Cloud is the only one, Bitbucket Data Center isn't supported.
 */
const publicUrlByType: Record<GitProvidersConfig.ProviderType, string | undefined> = {
    github: "https://github.com",
    gitlab: "https://gitlab.com",
    forgejo: undefined,
    bitbucket: "https://bitbucket.org"
};

/**
 * Where the user adds a provider of their own, with a personal access token. The
 * fields stay here, not in the core state: the token is a secret. The dialog is
 * unmounted when closed, which empties them.
 */
export function AddGitProviderDialog(props: Props) {
    const { view, onClose, onSubmit, getPersonalAccessTokenCreationUrl } = props;

    const { t } = useTranslation({ AddGitProviderDialog });

    return (
        <SideDialog title={t("title")} closeLabel={t("close")} onClose={onClose}>
            <GitProviderForm
                initialValues={undefined}
                isProviderEditable={true}
                error={view.error}
                isSubmitting={view.isSubmitting}
                submitLabel={t("add")}
                isIntroShown={true}
                onSubmit={onSubmit}
                onCancel={onClose}
                getPersonalAccessTokenCreationUrl={getPersonalAccessTokenCreationUrl}
            />
        </SideDialog>
    );
}

/**
 * The creation dialog, for an existing provider: the user switches from one to another
 * and can delete it. A provider of the admin: only its token can change.
 */
export function ManageGitProviderDialog(props: {
    view: Extract<ManageProviderDialogView, { isOpen: true }>;
    onProviderChange: (providerId: string) => void;
    onClose: () => void;
    onSubmit: (values: FormValues) => void;
    /** A provider added by the user is removed, otherwise its saved token */
    onDelete: () => void;
    getPersonalAccessTokenCreationUrl: Props["getPersonalAccessTokenCreationUrl"];
}) {
    const {
        view,
        onProviderChange,
        onClose,
        onSubmit,
        onDelete,
        getPersonalAccessTokenCreationUrl
    } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ AddGitProviderDialog });

    const { card } = view;

    return (
        <SideDialog title={t("manage title")} closeLabel={t("close")} onClose={onClose}>
            <div className={classes.manageRoot}>
                <div className={classes.manageHeader}>
                    <Select
                        className={classes.providerSelect}
                        value={card.id}
                        variant="standard"
                        disableUnderline={true}
                        disabled={view.isSubmitting}
                        inputProps={{ "aria-label": t("provider selector aria label") }}
                        onChange={event => onProviderChange(event.target.value)}
                    >
                        {view.providers.map(({ id, displayName }) => (
                            <MenuItem key={id} value={id}>
                                {displayName}
                            </MenuItem>
                        ))}
                    </Select>
                    <Text typo="body 1" className={classes.manageSubtitle}>
                        {t(
                            card.isAddedByUser
                                ? "custom profile"
                                : "provided by your organization"
                        )}
                    </Text>
                    <Button
                        variant="ternary"
                        startIcon={getIconUrlByName("Delete")}
                        disabled={view.isSubmitting}
                        onClick={onDelete}
                    >
                        {t(card.isAddedByUser ? "delete profile" : "remove token")}
                    </Button>
                </div>
                {card.personalAccessTokenExpirationTime !== undefined && (
                    <TokenExpiration time={card.personalAccessTokenExpirationTime} />
                )}
                <GitProviderForm
                    // NOTE: What was typed for another provider is discarded.
                    key={card.id}
                    initialValues={{
                        type: card.type,
                        url: card.url,
                        displayName: card.displayName,
                        personalAccessToken: view.personalAccessToken ?? ""
                    }}
                    isProviderEditable={view.isEditable}
                    error={view.error}
                    isSubmitting={view.isSubmitting}
                    submitLabel={t("save changes")}
                    isIntroShown={false}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                    getPersonalAccessTokenCreationUrl={getPersonalAccessTokenCreationUrl}
                />
            </div>
        </SideDialog>
    );
}

function GitProviderForm(props: {
    /** undefined: a new provider */
    initialValues: FormValues | undefined;
    /** false: its type, url and name are only shown */
    isProviderEditable: boolean;
    error: AddProviderError | ManageProviderError | undefined;
    isSubmitting: boolean;
    submitLabel: string;
    isIntroShown: boolean;
    onSubmit: (values: FormValues) => void;
    onCancel: () => void;
    getPersonalAccessTokenCreationUrl: Props["getPersonalAccessTokenCreationUrl"];
}) {
    const {
        initialValues,
        isProviderEditable,
        error,
        isSubmitting,
        submitLabel,
        isIntroShown,
        onSubmit,
        onCancel,
        getPersonalAccessTokenCreationUrl
    } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ AddGitProviderDialog });

    const [type, setType] = useState<GitProvidersConfig.ProviderType>(
        initialValues?.type ?? "gitlab"
    );
    const [isSelfHosted, setIsSelfHosted] = useState(
        initialValues !== undefined &&
            initialValues.url !== publicUrlByType[initialValues.type]
    );
    const [customUrl, setCustomUrl] = useState(
        initialValues !== undefined &&
            initialValues.url !== publicUrlByType[initialValues.type]
            ? initialValues.url
            : ""
    );
    const [displayName, setDisplayName] = useState(initialValues?.displayName ?? "");
    const [personalAccessToken, setPersonalAccessToken] = useState(
        initialValues?.personalAccessToken ?? ""
    );

    const publicUrl = publicUrlByType[type];
    const canBeSelfHosted = type === "github" || type === "gitlab";
    const isUrlFieldShown = publicUrl === undefined || (canBeSelfHosted && isSelfHosted);
    const url = isUrlFieldShown ? customUrl : (publicUrl ?? "");
    const providerName = providerNameByType[type];

    const personalAccessTokenCreationUrl = getPersonalAccessTokenCreationUrl({
        type,
        url
    });

    const urlError =
        error === "invalid url" || error === "already configured" ? t(error) : undefined;

    const canSubmit =
        !isSubmitting && url.trim() !== "" && personalAccessToken.trim() !== "";

    const onFormSubmit: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault();

        if (canSubmit) {
            onSubmit({
                type,
                url,
                // NOTE: Empty, the host of the url.
                displayName,
                // NOTE: Empty: the saved one is kept, it isn't checked again.
                personalAccessToken:
                    personalAccessToken === initialValues?.personalAccessToken
                        ? ""
                        : personalAccessToken
            });
        }
    };

    return (
        <form className={classes.root} onSubmit={onFormSubmit} noValidate={true}>
            <fieldset className={classes.body} disabled={isSubmitting}>
                <fieldset
                    className={classes.providerFields}
                    disabled={!isProviderEditable}
                >
                    <Section
                        title={t("provider section title")}
                        subtitle={t("provider section subtitle")}
                    >
                        <div
                            className={classes.providerOptions}
                            role="radiogroup"
                            aria-label={t("provider section title")}
                        >
                            {providerTypes.map(type_i => (
                                <ProviderOption
                                    key={type_i}
                                    type={type_i}
                                    name={providerNameByType[type_i]}
                                    description={t(`${type_i} description`)}
                                    isSelected={type_i === type}
                                    onSelect={() => setType(type_i)}
                                />
                            ))}
                        </div>
                        {!isUrlFieldShown && urlError !== undefined && (
                            <Text typo="body 2" className={classes.error}>
                                {urlError}
                            </Text>
                        )}
                        <FormTextField
                            label={t("display name")}
                            value={displayName}
                            onChange={setDisplayName}
                            autoComplete="off"
                        />
                    </Section>

                    {publicUrl === undefined || canBeSelfHosted ? (
                        <>
                            <Divider className={classes.divider} />
                            <Section
                                title={
                                    publicUrl === undefined
                                        ? t("instance title", { providerName })
                                        : t("self-hosted title", { providerName })
                                }
                                subtitle={
                                    type === "forgejo"
                                        ? t("forgejo cors hint")
                                        : t("self-hosted subtitle", { providerName })
                                }
                                action={
                                    canBeSelfHosted && (
                                        <Switch
                                            checked={isSelfHosted}
                                            onChange={event =>
                                                setIsSelfHosted(event.target.checked)
                                            }
                                            inputProps={{
                                                "aria-label": t("self-hosted title", {
                                                    providerName
                                                })
                                            }}
                                        />
                                    )
                                }
                            >
                                {isUrlFieldShown && (
                                    <>
                                        <FormTextField
                                            label={t("url")}
                                            value={customUrl}
                                            onChange={setCustomUrl}
                                            autoComplete="url"
                                            placeholder={`https://${type}.example.com`}
                                            errorMessage={urlError}
                                        />
                                    </>
                                )}
                            </Section>
                        </>
                    ) : null}
                </fieldset>

                <Divider className={classes.divider} />

                <Section
                    title={t("personal access token")}
                    subtitle={t(
                        type === "bitbucket"
                            ? "bitbucket token hint"
                            : "personal access token hint"
                    )}
                >
                    <FormTextField
                        label={t("token")}
                        value={personalAccessToken}
                        onChange={setPersonalAccessToken}
                        autoComplete="off"
                        isSensitive={true}
                        errorMessage={
                            error === "personal access token rejected" ||
                            error === "personal access token required"
                                ? t(error)
                                : undefined
                        }
                    />
                    {personalAccessTokenCreationUrl !== undefined && (
                        <Link
                            className={classes.inlineLink}
                            href={personalAccessTokenCreationUrl}
                            target="_blank"
                            rel="noreferrer"
                            underline="hover"
                        >
                            {t("create a token", { providerName })}
                            <Icon
                                icon={getIconUrlByName("OpenInNew")}
                                size="extra small"
                            />
                        </Link>
                    )}
                </Section>
            </fieldset>

            {/* NOTE: Out of the scrolling body, it must be seen after submitting */}
            {(error === "provider unreachable" || error === "save failed") && (
                <ErrorAlert title={t("error title")} message={t(error)} />
            )}

            {isIntroShown && (
                <Text typo="body 1" color="secondary">
                    {t("intro", { providerName })}
                </Text>
            )}

            <div className={classes.footer}>
                <Button variant="ternary" onClick={onCancel}>
                    {t("cancel")}
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? t("checking") : submitLabel}
                </Button>
            </div>
        </form>
    );
}

function Section(props: {
    title: string;
    subtitle: string;
    /** Next to the title */
    action?: ReactNode;
    children?: ReactNode;
}) {
    const { title, subtitle, action, children } = props;

    const { classes } = useStyles();

    return (
        <section className={classes.section}>
            <div className={classes.sectionHeading}>
                <div className={classes.sectionTitle}>
                    <Text typo="object heading">{title}</Text>
                    {action}
                </div>
                <Text typo="body 1" color="secondary">
                    {subtitle}
                </Text>
            </div>
            {children}
        </section>
    );
}

function ProviderOption(props: {
    type: GitProvidersConfig.ProviderType;
    name: string;
    description: string;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const { type, name, description, isSelected, onSelect } = props;

    const id = useId();
    const { classes, cx } = useStyles();

    return (
        <label
            htmlFor={id}
            className={cx(
                classes.providerOption,
                isSelected && classes.providerOption_selected
            )}
        >
            <img
                className={classes.providerLogo}
                src={defaultGitProviderLogoUrlByType[type]}
                alt=""
            />
            <span className={classes.providerText}>
                <Text typo="label 1">{name}</Text>
                <Text typo="caption" color="secondary">
                    {description}
                </Text>
            </span>
            <Radio
                id={id}
                checked={isSelected}
                onChange={onSelect}
                value={type}
                name="git-provider-type"
                inputProps={{ "aria-label": name }}
            />
        </label>
    );
}

const { i18n } = declareComponentKeys<
    | "title"
    | "close"
    | { K: "intro"; P: { providerName: string } }
    | "provider section title"
    | "provider section subtitle"
    | "github description"
    | "gitlab description"
    | "forgejo description"
    | "bitbucket description"
    | { K: "self-hosted title"; P: { providerName: string } }
    | { K: "self-hosted subtitle"; P: { providerName: string } }
    | { K: "instance title"; P: { providerName: string } }
    | "forgejo cors hint"
    | "url"
    | "display name"
    | "personal access token"
    | "personal access token hint"
    | "bitbucket token hint"
    | "token"
    | { K: "create a token"; P: { providerName: string } }
    | "error title"
    | AddProviderError
    | "personal access token required"
    | "manage title"
    | "provider selector aria label"
    | "custom profile"
    | "provided by your organization"
    | "delete profile"
    | "remove token"
    | "save changes"
    | "cancel"
    | "add"
    | "checking"
>()({ AddGitProviderDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AddGitProviderDialog }).create(({ theme }) => ({
    root: {
        flex: 1,
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
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
    divider: {
        borderColor: theme.colors.useCases.surfaces.surface3
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4)
    },
    sectionHeading: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(3)
    },
    providerOptions: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2)
    },
    providerOption: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        padding: theme.spacing(3),
        borderRadius: theme.spacing(3),
        border: "2px solid transparent",
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        cursor: "pointer",
        "&:hover": {
            borderColor: theme.colors.useCases.surfaces.surface3
        }
    },
    providerOption_selected: {
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        "&, &:hover": {
            borderColor: theme.colors.useCases.typography.textFocus
        }
    },
    providerLogo: {
        width: 40,
        height: 40,
        flexShrink: 0,
        objectFit: "contain",
        borderRadius: "50%"
    },
    providerText: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column"
    },
    error: {
        color: theme.colors.useCases.alertSeverity.error.main
    },
    inlineLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        alignSelf: "flex-start"
    },
    providerFields: {
        border: 0,
        padding: 0,
        margin: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
        "&:disabled": {
            opacity: 0.6
        }
    },
    manageRoot: {
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4)
    },
    manageHeader: {
        flex: "none",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: theme.spacing(2)
    },
    providerSelect: {
        ...theme.typography.variants["object heading"].style,
        color: theme.colors.useCases.typography.textPrimary
    },
    manageSubtitle: {
        flex: 1,
        textAlign: "right",
        color: theme.colors.useCases.typography.textSecondary
    },
    footer: {
        flex: "none",
        display: "flex",
        justifyContent: "flex-end",
        gap: theme.spacing(2)
    }
}));
