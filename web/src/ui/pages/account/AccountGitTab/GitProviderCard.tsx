import { useState } from "react";
import { Link } from "@mui/material";
import { getIconUrlByName } from "lazy-icons";
import { useResolveThemedAssetUrl } from "onyxia-ui";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import {
    declareComponentKeys,
    useLang,
    useResolveLocalizedString,
    useTranslation
} from "ui/i18n";
import type { AccountView, CardError } from "core/usecases/gitAccountUiController";
import { ProviderStateChip } from "../AccountAiTab/ProviderCard";
import { FormTextField } from "../AccountAiTab/shared/FormFields";
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
    onRemovePersonalAccessToken: () => void;
    /** Only for a provider added by the user, the confirmation is the caller's */
    onRemoveProvider: () => void;
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
        onRemovePersonalAccessToken,
        onRemoveProvider
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ GitProviderCard });
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();
    const { resolveLocalizedString } = useResolveLocalizedString();

    const { authentication } = card;

    return (
        <section className={cx(classes.root, className)}>
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
                <div className={classes.summary}>
                    <div className={classes.identity}>
                        <Text
                            className={classes.ellipsis}
                            typo="object heading"
                            htmlComponent="h3"
                        >
                            {card.displayName}
                        </Text>
                        <Text
                            className={classes.ellipsis}
                            typo="body 1"
                            color="secondary"
                        >
                            {card.url.replace(/^https?:\/\//, "")}
                            {card.isAddedByUser && ` · ${t("added by you")}`}
                        </Text>
                    </div>
                    {card.status === "connecting" ? (
                        <CircularProgress size={20} />
                    ) : (
                        <ProviderStateChip state={card.status} />
                    )}
                </div>
                <div className={classes.actions}>
                    {authentication.type === "personal-access-token" &&
                        authentication.isRemoveButtonShown && (
                            <Button
                                variant="ternary"
                                disabled={authentication.isDisabled}
                                onClick={onRemovePersonalAccessToken}
                            >
                                {t("remove")}
                            </Button>
                        )}
                    {card.removeProvider !== undefined && (
                        <Button
                            variant="ternary"
                            startIcon={getIconUrlByName("Delete")}
                            disabled={card.removeProvider.isDisabled}
                            onClick={onRemoveProvider}
                        >
                            {t("remove provider")}
                        </Button>
                    )}
                    {(() => {
                        switch (authentication.type) {
                            case "oauth":
                                return authentication.signIn === undefined ? (
                                    <Button
                                        variant="secondary"
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
                                if (authentication.isAddButtonShown) {
                                    return (
                                        <Button
                                            variant="primary"
                                            disabled={authentication.isDisabled}
                                            onClick={onStartEditingPersonalAccessToken}
                                        >
                                            {t("add a token")}
                                        </Button>
                                    );
                                }
                                if (authentication.isReplaceButtonShown) {
                                    return (
                                        <Button
                                            variant="secondary"
                                            disabled={authentication.isDisabled}
                                            onClick={onStartEditingPersonalAccessToken}
                                        >
                                            {t("replace")}
                                        </Button>
                                    );
                                }
                                if (authentication.isCancelButtonShown) {
                                    return (
                                        <Button
                                            variant="secondary"
                                            disabled={authentication.isDisabled}
                                            onClick={onCancelEditingPersonalAccessToken}
                                        >
                                            {t("cancel")}
                                        </Button>
                                    );
                                }
                                return null;
                        }
                    })()}
                </div>
            </div>

            {/* NOTE: Always one line, connected or not, the cards keep the same height */}
            <Text typo="body 2" color="secondary" className={classes.statusLine}>
                {(() => {
                    if (card.gitIdentity !== undefined) {
                        return card.gitIdentity.email === undefined
                            ? t("git identity without email", {
                                  name: card.gitIdentity.name
                              })
                            : t("git identity", {
                                  name: card.gitIdentity.name,
                                  email: card.gitIdentity.email
                              });
                    }

                    if (card.message?.type === "error") {
                        return t(card.message.reason);
                    }

                    return t(
                        authentication.type === "oauth"
                            ? "not connected oauth"
                            : "not connected personal access token",
                        { providerName: card.displayName }
                    );
                })()}
            </Text>

            {card.personalAccessTokenExpirationTime !== undefined && (
                <TokenExpiration time={card.personalAccessTokenExpirationTime} />
            )}

            {card.serviceTokenLifetimeDays !== undefined && (
                <Text typo="body 2" color="secondary" className={classes.statusLine}>
                    {t("service tokens lifetime", {
                        days: card.serviceTokenLifetimeDays
                    })}
                </Text>
            )}

            {card.documentation !== undefined && (
                <div className={classes.documentation}>
                    <Text typo="body 2" color="secondary">
                        {resolveLocalizedString(card.documentation.mainText)}
                    </Text>
                    {card.documentation.links.map(link => (
                        <Link
                            key={link.url}
                            className={classes.inlineLink}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            underline="hover"
                        >
                            {resolveLocalizedString(link.label)}
                            <Icon
                                icon={getIconUrlByName("OpenInNew")}
                                size="extra small"
                            />
                        </Link>
                    ))}
                </div>
            )}

            {authentication.type === "personal-access-token" &&
                authentication.isFormShown && (
                    <PersonalAccessTokenForm
                        providerName={card.displayName}
                        personalAccessTokenCreationUrl={
                            authentication.personalAccessTokenCreationUrl
                        }
                        isDisabled={authentication.isDisabled}
                        isChecking={card.pendingAction === "set personal access token"}
                        onSubmit={onSetPersonalAccessToken}
                    />
                )}

            {card.error !== undefined && (
                <div role="alert">
                    <Text typo="body 2" className={classes.error}>
                        <CardErrorMessage
                            error={card.error}
                            providerName={card.displayName}
                        />
                    </Text>
                </div>
            )}

            {card.authorizedApplications !== undefined && (
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
            )}
        </section>
    );
}

function TokenExpiration(props: { time: number }) {
    const { time } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ GitProviderCard });
    const { lang } = useLang();

    const date = new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(time);

    if (time - Date.now() > TOKEN_EXPIRES_SOON_MS) {
        return (
            <Text typo="body 2" color="secondary" className={classes.statusLine}>
                {t("token expires on", { date })}
            </Text>
        );
    }

    return (
        <div className={cx(classes.statusLine, classes.tokenExpiresSoon)}>
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
 * The token being typed stays here, not in the core state: it is a secret. The form
 * unmounts once the token is saved, which empties it.
 */
function PersonalAccessTokenForm(props: {
    providerName: string;
    personalAccessTokenCreationUrl: string;
    isDisabled: boolean;
    isChecking: boolean;
    onSubmit: (params: { personalAccessToken: string }) => void;
}) {
    const {
        providerName,
        personalAccessTokenCreationUrl,
        isDisabled,
        isChecking,
        onSubmit
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
            <FormTextField
                label={t("personal access token")}
                value={personalAccessToken}
                onChange={setPersonalAccessToken}
                autoComplete="off"
                isSensitive={true}
            />
            <div className={classes.tokenFormFooter}>
                <Link
                    className={classes.inlineLink}
                    href={personalAccessTokenCreationUrl}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                >
                    {t("create a token", { providerName })}
                    <Icon icon={getIconUrlByName("OpenInNew")} size="extra small" />
                </Link>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={isDisabled || personalAccessToken.trim() === ""}
                >
                    {isChecking ? t("checking") : t("save")}
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
        containerType: "inline-size",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        padding: theme.spacing(4),
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        borderRadius: theme.spacing(3),
        backgroundColor: theme.colors.useCases.surfaces.surface1
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2.5),
        minWidth: 0,
        // The action goes below rather than squeezing the name
        "@container (max-width: 560px)": {
            flexWrap: "wrap"
        }
    },
    logo: {
        width: 48,
        height: 48,
        flexShrink: 0,
        objectFit: "contain",
        borderRadius: "50%"
    },
    summary: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(5),
        "@container (max-width: 560px)": {
            flexBasis: "calc(100% - 60px)",
            gap: theme.spacing(3)
        }
    },
    identity: {
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
    statusLine: {
        marginTop: -theme.spacing(2)
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
    documentation: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    inlineLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        alignSelf: "flex-start"
    },
    tokenForm: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1.5)
    },
    tokenFormFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: theme.spacing(2)
    },
    error: {
        color: theme.colors.useCases.alertSeverity.error.main
    },
    actions: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: theme.spacing(2),
        marginLeft: "auto"
    }
}));

const { i18n } = declareComponentKeys<
    | { K: "git identity"; P: { name: string; email: string } }
    | { K: "git identity without email"; P: { name: string } }
    | { K: "not connected oauth"; P: { providerName: string } }
    | { K: "not connected personal access token"; P: { providerName: string } }
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
    | { K: "create a token"; P: { providerName: string } }
    | "save"
    | "checking"
    | "replace"
    | "cancel"
    | "remove"
    | "remove failed"
    | "added by you"
    | "remove provider"
    | "remove provider failed"
    | "token rejected"
    | "token check failed"
    | { K: "token expires on"; P: { date: string } }
    | { K: "token expires soon"; P: { date: string } }
    | { K: "service tokens lifetime"; P: { days: number } }
>()({ GitProviderCard });
export type I18n = typeof i18n;
