import { useState } from "react";
import { Link } from "@mui/material";
import { getIconUrlByName } from "lazy-icons";
import { useResolveThemedAssetUrl } from "onyxia-ui";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys, useLang, useTranslation } from "ui/i18n";
import {
    getIsProviderCardManageable,
    type AccountView,
    type CardError
} from "core/usecases/gitAccountUiController";
import { ErrorAlert } from "ui/shared/ErrorAlert";
import { FormTextField } from "ui/shared/FormFields";
import { defaultGitProviderLogoUrlByType } from "./defaultGitProviderLogoUrlByType";

/** From there, the expiration of the token is a warning */
const TOKEN_EXPIRES_SOON_MS = 14 * 24 * 3600_000;

type Props = {
    className?: string;
    card: AccountView.ProviderCard;
    /** Must open the popup synchronously, it is called from the click handler */
    onSignIn: () => void;
    onSignOut: () => void;
    onSetPersonalAccessToken: (params: { personalAccessToken: string }) => void;
    onStartEditingPersonalAccessToken: () => void;
    onCancelEditingPersonalAccessToken: () => void;
    /** Only when the card has something to manage, see getIsProviderCardManageable */
    onManage: () => void;
};

export function GitProviderCard(props: Props) {
    const {
        className,
        card,
        onSignIn,
        onSignOut,
        onSetPersonalAccessToken,
        onStartEditingPersonalAccessToken,
        onCancelEditingPersonalAccessToken,
        onManage
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ GitProviderCard });
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();

    const { authentication } = card;

    return (
        <section
            className={cx(
                classes.root,
                authentication.type === "personal-access-token" &&
                    (authentication.isFormShown || card.status === "connected") &&
                    classes.root_tokenField,
                className
            )}
        >
            <div className={classes.header}>
                <img
                    className={classes.logo}
                    src={
                        card.logoUrl !== undefined
                            ? resolveThemedAssetUrl(card.logoUrl)
                            : defaultGitProviderLogoUrlByType[card.type]
                    }
                    alt=""
                />
                <div className={classes.identity}>
                    <Text
                        className={classes.ellipsis}
                        typo="object heading"
                        htmlComponent="h3"
                    >
                        {card.displayName}
                    </Text>
                    <Text className={classes.ellipsis} typo="body 1" color="secondary">
                        {t(
                            card.isAddedByUser
                                ? "added by you"
                                : "provided by your organization"
                        )}
                    </Text>
                </div>
                {card.status === "connecting" ? (
                    <CircularProgress size={20} />
                ) : (
                    <GitProfileStateChip card={card} />
                )}
            </div>

            {authentication.type === "personal-access-token" &&
            authentication.isFormShown ? (
                <PersonalAccessTokenForm
                    personalAccessTokenCreationUrl={
                        authentication.personalAccessTokenCreationUrl
                    }
                    errorMessage={(() => {
                        switch (card.error?.type) {
                            case "personal access token rejected":
                                return t("token rejected");
                            case "personal access token check failed":
                                return t("token check failed");
                            default:
                                return undefined;
                        }
                    })()}
                    isDisabled={authentication.isDisabled}
                    isChecking={card.pendingAction === "set personal access token"}
                    onSubmit={onSetPersonalAccessToken}
                    onCancel={onCancelEditingPersonalAccessToken}
                />
            ) : (
                <>
                    <div className={classes.body}>
                        {(() => {
                            if (
                                authentication.type === "personal-access-token" &&
                                card.status === "connected"
                            ) {
                                return (
                                    <SavedPersonalAccessToken
                                        personalAccessTokenCreationUrl={
                                            authentication.personalAccessTokenCreationUrl
                                        }
                                    />
                                );
                            }

                            return (
                                <>
                                    {card.message?.type === "connected as" ? (
                                        <>
                                            <p className={classes.bodyText}>
                                                {t("connected as")}{" "}
                                                <span className={classes.emphasis}>
                                                    {card.message.user.username}
                                                </span>
                                            </p>
                                            <p className={classes.bodyText}>
                                                {t("server url")}{" "}
                                                <Link
                                                    className={classes.serverUrl}
                                                    href={card.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    underline="always"
                                                >
                                                    {card.url}
                                                    <Icon
                                                        icon={getIconUrlByName(
                                                            "OpenInNew"
                                                        )}
                                                        size="small"
                                                    />
                                                </Link>
                                            </p>
                                        </>
                                    ) : (
                                        <p className={classes.bodyText}>
                                            {t("not connected")}
                                        </p>
                                    )}
                                    <CardNotice card={card} />
                                </>
                            );
                        })()}
                    </div>

                    <div className={classes.actions}>
                        {getIsProviderCardManageable(card) && (
                            <Button variant="ternary" onClick={onManage}>
                                {t("manage")}
                            </Button>
                        )}
                        {(() => {
                            switch (authentication.type) {
                                case "oauth":
                                    return authentication.signIn === undefined ? (
                                        <Button
                                            variant="ternary"
                                            disabled={authentication.isDisabled}
                                            onClick={onSignOut}
                                        >
                                            {t("sign out")}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            disabled={authentication.isDisabled}
                                            onClick={onSignIn}
                                        >
                                            {t(authentication.signIn.label)}
                                        </Button>
                                    );
                                case "personal-access-token":
                                    return (
                                        <Button
                                            variant="primary"
                                            disabled={authentication.isDisabled}
                                            onClick={onStartEditingPersonalAccessToken}
                                        >
                                            {/* NOTE: "setup required": no token saved yet */}
                                            {t(
                                                card.status === "setup required"
                                                    ? "add a token"
                                                    : "replace"
                                            )}
                                        </Button>
                                    );
                            }
                        })()}
                    </div>
                </>
            )}
        </section>
    );
}

/** Under the connection status: what went wrong, or what the user should know */
function CardNotice(props: { card: AccountView.ProviderCard }) {
    const { card } = props;

    const { t } = useTranslation({ GitProviderCard });

    if (card.error !== undefined) {
        return (
            <ErrorAlert
                message={
                    <CardErrorMessage
                        error={card.error}
                        providerName={card.displayName}
                    />
                }
            />
        );
    }

    if (card.message?.type === "error") {
        return <ErrorAlert message={t(card.message.reason)} />;
    }

    if (card.authorizedApplications !== undefined) {
        return (
            <Text typo="body 2" color="secondary">
                {(() => {
                    switch (card.authorizedApplications.reason) {
                        case "grant scope conflict":
                            return t("revoke previous grant", {
                                providerName: card.displayName
                            });
                        case "signed out without revocation":
                            return t("revoke on provider", {
                                providerName: card.displayName
                            });
                    }
                })()}{" "}
                <Link
                    href={card.authorizedApplications.url}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                >
                    {t("authorized applications")}
                </Link>
            </Text>
        );
    }

    return null;
}

/** The token itself is never read back: only that one is saved */
function SavedPersonalAccessToken(props: { personalAccessTokenCreationUrl: string }) {
    const { personalAccessTokenCreationUrl } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ GitProviderCard });

    return (
        <div className={classes.tokenField}>
            <Text typo="label 1">{t("new access token")}</Text>
            <div className={classes.savedToken} aria-label={t("personal access token")}>
                {"•".repeat(28)}
            </div>
            <TokenCreationLink url={personalAccessTokenCreationUrl} />
        </div>
    );
}

function TokenCreationLink(props: { url: string }) {
    const { url } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ GitProviderCard });

    return (
        <Link
            className={classes.tokenCreationLink}
            href={url}
            target="_blank"
            rel="noreferrer"
            underline="always"
        >
            {t("generate a new token")}
            <Icon icon={getIconUrlByName("OpenInNew")} size="extra small" />
        </Link>
    );
}

/** Figma's chip of the Git profile: what the user has to do, if anything */
function GitProfileStateChip(props: { card: AccountView.ProviderCard }) {
    const { card } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ GitProviderCard });

    const { severity, label } = ((): {
        severity: "success" | "warning" | "error";
        label: string;
    } => {
        if (card.status === "connected") {
            return { severity: "success", label: t("chip connected") };
        }

        if (card.message?.type === "error") {
            return card.message.reason === "session expired"
                ? { severity: "warning", label: t("chip reconnect required") }
                : { severity: "error", label: t("chip connection error") };
        }

        return { severity: "warning", label: t("chip connection required") };
    })();

    return (
        <span
            className={cx(
                classes.chip,
                severity === "success" && classes.chip_success,
                severity === "warning" && classes.chip_warning,
                severity === "error" && classes.chip_error
            )}
        >
            <span
                className={cx(
                    classes.chipDot,
                    severity === "success" && classes.chipDot_success,
                    severity === "warning" && classes.chipDot_warning,
                    severity === "error" && classes.chipDot_error
                )}
            />
            {label}
        </span>
    );
}

export function TokenExpiration(props: { time: number }) {
    const { time } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ GitProviderCard });
    const { lang } = useLang();

    const date = new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(time);

    if (time - Date.now() > TOKEN_EXPIRES_SOON_MS) {
        return (
            <Text typo="body 2" color="secondary">
                {t("token expires on", { date })}
            </Text>
        );
    }

    return (
        <div className={classes.tokenExpiresSoon}>
            <Icon
                className={classes.tokenExpiresSoonIcon}
                icon={getIconUrlByName("WarningAmber")}
                size="small"
            />
            <Text typo="body 2" className={classes.tokenExpiresSoonText}>
                {t("token expires soon", { date })}
            </Text>
        </div>
    );
}

/**
 * In place of the card's content. The token being typed stays here, not in the core
 * state: it is a secret. The form unmounts once the token is saved, which empties it.
 */
function PersonalAccessTokenForm(props: {
    personalAccessTokenCreationUrl: string;
    errorMessage: string | undefined;
    isDisabled: boolean;
    isChecking: boolean;
    onSubmit: (params: { personalAccessToken: string }) => void;
    onCancel: () => void;
}) {
    const {
        personalAccessTokenCreationUrl,
        errorMessage,
        isDisabled,
        isChecking,
        onSubmit,
        onCancel
    } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ GitProviderCard });

    const [personalAccessToken, setPersonalAccessToken] = useState("");

    return (
        <form
            className={classes.tokenForm}
            onSubmit={event => {
                event.preventDefault();
                onSubmit({ personalAccessToken });
            }}
        >
            <div className={classes.tokenField}>
                <FormTextField
                    label={t("new access token")}
                    placeholder={t("access token")}
                    value={personalAccessToken}
                    onChange={setPersonalAccessToken}
                    autoComplete="off"
                    isSensitive={true}
                    errorMessage={errorMessage}
                />
                <TokenCreationLink url={personalAccessTokenCreationUrl} />
            </div>
            <div className={classes.actions}>
                <Button variant="ternary" disabled={isChecking} onClick={onCancel}>
                    {t("cancel")}
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={isDisabled || personalAccessToken.trim() === ""}
                >
                    {isChecking ? t("checking") : t("confirm access token")}
                </Button>
            </div>
        </form>
    );
}

export function CardErrorMessage(props: { error: CardError; providerName: string }) {
    const { error, providerName } = props;

    const { t } = useTranslation({ GitProviderCard });

    switch (error.type) {
        case "popup blocked":
            return <>{t("popup blocked")}</>;
        case "sign in cancelled":
            return <>{t("sign in cancelled")}</>;
        case "sign in denied":
            return (
                <>
                    {t("sign in denied")}
                    {error.providerError !== undefined && ` (${error.providerError})`}
                </>
            );
        case "grant scope conflict":
            return <>{t("grant scope conflict", { providerName })}</>;
        case "sign in failed":
            return <>{t("sign in failed")}</>;
        case "sign out failed":
            return <>{t("sign out failed")}</>;
        case "personal access token rejected":
            return <>{t("token rejected")}</>;
        case "personal access token check failed":
            return <>{t("token check failed")}</>;
        case "remove failed":
            return <>{t("remove failed")}</>;
        case "remove provider failed":
            return <>{t("remove provider failed")}</>;
    }
}

const useStyles = tss.withName({ GitProviderCard }).create(({ theme }) => ({
    root: {
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        // NOTE: Whatever its state, the card keeps the size of the mockup.
        height: 270,
        padding: 24,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        borderRadius: 16
    },
    // NOTE: The mockup's spacing when the token field is shown, the card keeps its size.
    root_tokenField: {
        gap: 16
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 0
    },
    logo: {
        width: 48,
        height: 48,
        flexShrink: 0,
        objectFit: "contain",
        borderRadius: 12
    },
    identity: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column"
    },
    ellipsis: {
        margin: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    chip: {
        ...theme.typography.variants["label 2"].style,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
        padding: "4px 12px",
        borderRadius: 100,
        whiteSpace: "nowrap",
        color: theme.colors.useCases.typography.textPrimary
    },
    chip_success: {
        backgroundColor: theme.colors.useCases.alertSeverity.success.background
    },
    chip_warning: {
        backgroundColor: theme.colors.useCases.alertSeverity.warning.background
    },
    chip_error: {
        backgroundColor: theme.colors.useCases.alertSeverity.error.background
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: "50%"
    },
    chipDot_success: {
        backgroundColor: theme.colors.useCases.alertSeverity.success.main
    },
    chipDot_warning: {
        backgroundColor: theme.colors.useCases.alertSeverity.warning.main
    },
    chipDot_error: {
        backgroundColor: theme.colors.useCases.alertSeverity.error.main
    },
    body: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
        overflow: "hidden"
    },
    bodyText: {
        ...theme.typography.variants["body 1"].style,
        margin: 0,
        fontSize: 20,
        lineHeight: "27.2px",
        color: theme.colors.useCases.typography.textSecondary,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    emphasis: {
        color: theme.colors.useCases.typography.textPrimary,
        fontWeight: 600
    },
    serverUrl: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontWeight: 500,
        color: theme.colors.useCases.typography.textFocus
    },
    tokenExpiresSoon: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2)
    },
    tokenExpiresSoonIcon: {
        color: theme.colors.useCases.alertSeverity.warning.main,
        flexShrink: 0
    },
    tokenExpiresSoonText: {
        color: theme.colors.useCases.alertSeverity.warning.main
    },
    tokenForm: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: 16
    },
    tokenField: {
        display: "flex",
        flexDirection: "column",
        gap: 4
    },
    savedToken: {
        ...theme.typography.variants["label 1"].style,
        boxSizing: "border-box",
        height: 45,
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textPrimary
    },
    tokenCreationLink: {
        ...theme.typography.variants["body 2"].style,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        color: theme.colors.useCases.typography.textFocus
    },
    actions: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8
    }
}));

const { i18n } = declareComponentKeys<
    | "provided by your organization"
    | "connected as"
    | "server url"
    | "not connected"
    | "add a token"
    | "personal access token rejected"
    | "session expired"
    | "loading failed"
    | "sign in"
    | "sign in again"
    | "sign out"
    | "popup blocked"
    | "sign in cancelled"
    | "sign in denied"
    | "sign in failed"
    | "sign out failed"
    | { K: "revoke on provider"; P: { providerName: string } }
    | { K: "grant scope conflict"; P: { providerName: string } }
    | { K: "revoke previous grant"; P: { providerName: string } }
    | "authorized applications"
    | "personal access token"
    | "checking"
    | "replace"
    | "cancel"
    | "remove failed"
    | "added by you"
    | "remove provider failed"
    | "token rejected"
    | "token check failed"
    | { K: "token expires on"; P: { date: string } }
    | { K: "token expires soon"; P: { date: string } }
    | "new access token"
    | "access token"
    | "generate a new token"
    | "confirm access token"
    | "manage"
    | "chip connected"
    | "chip connection required"
    | "chip reconnect required"
    | "chip connection error"
>()({ GitProviderCard });
export type I18n = typeof i18n;
