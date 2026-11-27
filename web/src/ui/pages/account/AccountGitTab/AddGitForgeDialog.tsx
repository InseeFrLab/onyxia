import { useState, type FormEventHandler, type ReactNode } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import RadioGroup from "@mui/material/RadioGroup";
import { Link } from "@mui/material";
import Divider from "@mui/material/Divider";
import Radio from "@mui/material/Radio";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type {
    AddForgeDialogState,
    AddForgeError,
    ManageForgeDialogView,
    ManageForgeError
} from "core/usecases/gitAccountUiController";
import { SideDialog } from "ui/shared/SideDialog";
import { ErrorAlert } from "ui/shared/ErrorAlert";
import { FormSelectField, FormTextField } from "ui/shared/FormFields";
import { getFieldStyle } from "ui/shared/fieldStyle";
import { defaultGitForgeLogoUrlByType } from "./defaultGitForgeLogoUrlByType";
import { TokenExpiration } from "./GitForgeCard";

type FormValues = {
    type: GitForgesConfig.ForgeType;
    url: string;
    displayName: string;
    personalAccessToken: string;
};

type Props = {
    view: AddForgeDialogState;
    /** What the form starts with, empty by default */
    initialValues?: FormValues;
    onClose: () => void;
    onSubmit: (params: {
        type: GitForgesConfig.ForgeType;
        url: string;
        displayName: string;
        personalAccessToken: string;
    }) => void;
    getPersonalAccessTokenCreationUrl: (params: {
        type: GitForgesConfig.ForgeType;
        url: string;
    }) => string | undefined;
};

const forgeTypes = ["github", "gitlab", "forgejo", "bitbucket"] as const;

const forgeNameByType: Record<GitForgesConfig.ForgeType, string> = {
    github: "GitHub",
    gitlab: "GitLab",
    forgejo: "Forgejo",
    bitbucket: "Bitbucket"
};

/**
 * The public instance, undefined for Forgejo: it has none, the user always types
 * the url. Bitbucket Cloud is the only one, Bitbucket Data Center isn't supported.
 */
const publicUrlByType: Record<GitForgesConfig.ForgeType, string | undefined> = {
    github: "https://github.com",
    gitlab: "https://gitlab.com",
    forgejo: undefined,
    bitbucket: "https://bitbucket.org"
};

/**
 * Where the user adds a forge of their own, with a personal access token. The
 * fields stay here, not in the core state: the token is a secret. The dialog is
 * unmounted when closed, which empties them.
 */
export function AddGitForgeDialog(props: Props) {
    const { view, initialValues, onClose, onSubmit, getPersonalAccessTokenCreationUrl } =
        props;

    const { t } = useTranslation({ AddGitForgeDialog });

    return (
        <SideDialog title={t("title")} closeLabel={t("close")} onClose={onClose}>
            <GitForgeForm
                initialValues={initialValues}
                isForgeEditable={true}
                error={view.error}
                isSubmitting={view.isSubmitting}
                submitLabel={t("authenticate")}
                isIntroShown={true}
                onSubmit={onSubmit}
                onCancel={onClose}
                getPersonalAccessTokenCreationUrl={getPersonalAccessTokenCreationUrl}
            />
        </SideDialog>
    );
}

/**
 * The creation dialog, for an existing forge: the user switches from one to another
 * and can delete it. A forge of the admin: only its token can change.
 */
export function ManageGitForgeDialog(props: {
    view: Extract<ManageForgeDialogView, { isOpen: true }>;
    onForgeChange: (forgeId: string) => void;
    onClose: () => void;
    onSubmit: (values: FormValues) => void;
    /** A forge added by the user is removed, otherwise its saved token */
    onDelete: () => void;
    getPersonalAccessTokenCreationUrl: Props["getPersonalAccessTokenCreationUrl"];
}) {
    const {
        view,
        onForgeChange,
        onClose,
        onSubmit,
        onDelete,
        getPersonalAccessTokenCreationUrl
    } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ AddGitForgeDialog });

    const { card } = view;

    return (
        <SideDialog title={t("manage title")} closeLabel={t("close")} onClose={onClose}>
            <div className={classes.manageRoot}>
                <div className={classes.manageHeader}>
                    <Select
                        className={classes.forgeSelect}
                        value={card.id}
                        variant="standard"
                        disableUnderline={true}
                        disabled={view.isSubmitting}
                        inputProps={{ "aria-label": t("forge selector aria label") }}
                        onChange={event => onForgeChange(event.target.value)}
                    >
                        {view.forges.map(({ id, displayName }) => (
                            <MenuItem
                                key={id}
                                value={id}
                                className={classes.forgeMenuItem}
                            >
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
                <GitForgeForm
                    // NOTE: What was typed for another forge is discarded.
                    key={card.id}
                    initialValues={{
                        type: card.type,
                        url: card.url,
                        displayName: card.displayName,
                        personalAccessToken: view.personalAccessToken ?? ""
                    }}
                    isForgeEditable={view.isEditable}
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

function GitForgeForm(props: {
    /** undefined: a new forge */
    initialValues: FormValues | undefined;
    /** false: its type, url and name are only shown */
    isForgeEditable: boolean;
    error: AddForgeError | ManageForgeError | undefined;
    isSubmitting: boolean;
    submitLabel: string;
    isIntroShown: boolean;
    onSubmit: (values: FormValues) => void;
    onCancel: () => void;
    getPersonalAccessTokenCreationUrl: Props["getPersonalAccessTokenCreationUrl"];
}) {
    const {
        initialValues,
        isForgeEditable,
        error,
        isSubmitting,
        submitLabel,
        isIntroShown,
        onSubmit,
        onCancel,
        getPersonalAccessTokenCreationUrl
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ AddGitForgeDialog });

    // NOTE: undefined until the user picks one, the rest of the form follows from it.
    const [type, setType] = useState<GitForgesConfig.ForgeType | undefined>(
        initialValues?.type
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

    const publicUrl = type === undefined ? undefined : publicUrlByType[type];
    const canBeSelfHosted = type === "github" || type === "gitlab";
    const isUrlFieldShown =
        type !== undefined &&
        (publicUrl === undefined || (canBeSelfHosted && isSelfHosted));
    const url = isUrlFieldShown ? customUrl : (publicUrl ?? "");
    const forgeName = type === undefined ? undefined : forgeNameByType[type];

    const personalAccessTokenCreationUrl =
        type === undefined ? undefined : getPersonalAccessTokenCreationUrl({ type, url });

    const urlError =
        error === "invalid url" || error === "already configured" ? t(error) : undefined;

    const canSubmit =
        type !== undefined &&
        !isSubmitting &&
        url.trim() !== "" &&
        personalAccessToken.trim() !== "";

    const onFormSubmit: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

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
    };

    const urlField = (params: { isLabelHidden: boolean }) => (
        <FormTextField
            label={t("instance label")}
            isLabelHidden={params.isLabelHidden}
            value={customUrl}
            onChange={setCustomUrl}
            autoComplete="url"
            placeholder={t("url placeholder")}
            errorMessage={urlError}
        />
    );

    return (
        <form className={classes.root} onSubmit={onFormSubmit} noValidate={true}>
            <fieldset className={classes.body} disabled={isSubmitting}>
                <fieldset className={classes.forgeFields} disabled={!isForgeEditable}>
                    <Section
                        title={t("forge section title")}
                        subtitle={t("forge section subtitle")}
                    >
                        <FormSelectField
                            label={t("forge section title")}
                            value={type ?? ""}
                            onChange={value =>
                                setType(value as GitForgesConfig.ForgeType)
                            }
                            options={forgeTypes.map(type_i => ({
                                value: type_i,
                                label: forgeNameByType[type_i],
                                iconUrl: defaultGitForgeLogoUrlByType[type_i]
                            }))}
                            placeholder={t("forge placeholder")}
                            disabled={!isForgeEditable || isSubmitting}
                        />

                        {(() => {
                            if (type === undefined) {
                                return null;
                            }

                            // NOTE: Forgejo has no public instance, its url is required.
                            if (publicUrl === undefined) {
                                return (
                                    <div className={classes.instance}>
                                        {urlField({ isLabelHidden: false })}
                                        <Text typo="body 2" color="secondary">
                                            {t("forgejo cors hint")}
                                        </Text>
                                    </div>
                                );
                            }

                            if (!canBeSelfHosted) {
                                return null;
                            }

                            return (
                                <div className={classes.instance}>
                                    <Text typo="label 1">{t("instance label")}</Text>
                                    <RadioGroup
                                        className={classes.instanceOptions}
                                        aria-label={t("instance label")}
                                        value={isSelfHosted ? "self-hosted" : "public"}
                                        onChange={event =>
                                            setIsSelfHosted(
                                                event.target.value === "self-hosted"
                                            )
                                        }
                                    >
                                        {(["public", "self-hosted"] as const).map(
                                            option => (
                                                <FormControlLabel
                                                    key={option}
                                                    value={option}
                                                    control={<Radio size="small" />}
                                                    className={cx(
                                                        classes.instanceOption,
                                                        (option === "self-hosted") ===
                                                            isSelfHosted &&
                                                            classes.instanceOption_selected
                                                    )}
                                                    label={
                                                        option === "public"
                                                            ? new URL(publicUrl).host
                                                            : t("self-hosted instance")
                                                    }
                                                />
                                            )
                                        )}
                                    </RadioGroup>
                                    {isSelfHosted && urlField({ isLabelHidden: true })}
                                </div>
                            );
                        })()}

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
                            // NOTE: Left empty, the profile is named after the host.
                            placeholder={getHost(url) ?? t("display name")}
                        />
                    </Section>
                </fieldset>

                {type !== undefined && forgeName !== undefined && (
                    <>
                        <Divider className={classes.divider} />

                        <Section
                            title={t("personal access token")}
                            subtitle={t(
                                type === "bitbucket"
                                    ? "bitbucket token hint"
                                    : "personal access token hint"
                            )}
                        >
                            <div className={classes.tokenField}>
                                <FormTextField
                                    label={t("personal access token")}
                                    placeholder={t("token placeholder")}
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
                                        className={classes.tokenCreationLink}
                                        href={personalAccessTokenCreationUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        underline="always"
                                    >
                                        {t("create a token", { forgeName })}
                                        <Icon
                                            icon={getIconUrlByName("OpenInNew")}
                                            size="extra small"
                                        />
                                    </Link>
                                )}
                            </div>
                        </Section>
                    </>
                )}
            </fieldset>

            {/* NOTE: Out of the scrolling body, it must be seen after submitting */}
            {(error === "forge unreachable" || error === "save failed") && (
                <ErrorAlert title={t("error title")} message={t(error)} />
            )}

            {isIntroShown && forgeName !== undefined && (
                <Text typo="body 1" color="secondary">
                    {t("intro", { forgeName })}
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

function getHost(url: string): string | undefined {
    try {
        return new URL(url).host || undefined;
    } catch {
        return undefined;
    }
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

const { i18n } = declareComponentKeys<
    | "title"
    | "close"
    | { K: "intro"; P: { forgeName: string } }
    | "forge section title"
    | "forge section subtitle"
    | "forgejo cors hint"
    | "display name"
    | "personal access token"
    | "personal access token hint"
    | "bitbucket token hint"
    | { K: "create a token"; P: { forgeName: string } }
    | "error title"
    | AddForgeError
    | "personal access token required"
    | "manage title"
    | "forge selector aria label"
    | "custom profile"
    | "provided by your organization"
    | "delete profile"
    | "remove token"
    | "save changes"
    | "cancel"
    | "checking"
    | "forge placeholder"
    | "instance label"
    | "self-hosted instance"
    | "url placeholder"
    | "token placeholder"
    | "authenticate"
>()({ AddGitForgeDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AddGitForgeDialog }).create(({ theme }) => ({
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
    error: {
        color: theme.colors.useCases.alertSeverity.error.main
    },
    instance: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3)
    },
    instanceOptions: {
        gap: theme.spacing(2)
    },
    instanceOption: {
        margin: 0,
        gap: theme.spacing(2),
        "& .MuiRadio-root": {
            padding: 0
        },
        "& .MuiFormControlLabel-label": {
            ...theme.typography.variants["label 1"].style
        }
    },
    instanceOption_selected: {
        "& .MuiFormControlLabel-label": {
            fontWeight: 600
        }
    },
    tokenField: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    tokenCreationLink: {
        ...theme.typography.variants["body 2"].style,
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        alignSelf: "flex-start",
        color: theme.colors.useCases.typography.textFocus
    },
    forgeFields: {
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
    forgeSelect: {
        ...theme.typography.variants["object heading"].style,
        color: theme.colors.useCases.typography.textPrimary
    },
    forgeMenuItem: getFieldStyle({ theme }).option,
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
