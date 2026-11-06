import { useState } from "react";
import { Link } from "@mui/material";
import { getIconUrlByName } from "lazy-icons";
import { useResolveThemedAssetUrl } from "onyxia-ui";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys, useResolveLocalizedString, useTranslation } from "ui/i18n";
import type { AccountView, CardError } from "core/usecases/gitAccountUiController";
import { ProviderStateChip } from "../AccountAiTab/ProviderCard";
import { FormTextField } from "../AccountAiTab/shared/FormFields";

type Props = {
    className?: string;
    card: AccountView.ProviderCard;
    /** Must open the popup synchronously, it is called from the click handler */
    onSignIn: () => void;
    onSignOut: () => void;
    onSetPersonalAccessToken: (params: { personalAccessToken: string }) => void;
    onStartReplacingPersonalAccessToken: () => void;
    onCancelReplacingPersonalAccessToken: () => void;
    onRemovePersonalAccessToken: () => void;
    /** Only for a provider added by the user, the confirmation is the caller's */
    onRemoveProvider: () => void;
    onSetFavorite: () => void;
};

export function GitProviderCard(props: Props) {
    const {
        className,
        card,
        onSignIn,
        onSignOut,
        onSetPersonalAccessToken,
        onStartReplacingPersonalAccessToken,
        onCancelReplacingPersonalAccessToken,
        onRemovePersonalAccessToken,
        onRemoveProvider,
        onSetFavorite
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ GitProviderCard });
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();
    const { resolveLocalizedString } = useResolveLocalizedString();

    const { authentication } = card;

    return (
        <section className={cx(classes.root, className)}>
            <div className={classes.header}>
                {card.logoUrl !== undefined ? (
                    <img
                        className={classes.logo}
                        src={resolveThemedAssetUrl(card.logoUrl)}
                        alt=""
                    />
                ) : (
                    <Icon
                        className={classes.logoFallback}
                        icon={getIconUrlByName("Code")}
                        size="large"
                    />
                )}
                <div className={classes.identity}>
                    <Text
                        className={classes.ellipsis}
                        typo="object heading"
                        htmlComponent="h3"
                    >
                        {card.displayName}
                    </Text>
                    <Link
                        className={classes.ellipsis}
                        href={card.url}
                        target="_blank"
                        rel="noreferrer"
                        underline="hover"
                    >
                        {card.url.replace(/^https?:\/\//, "")}
                    </Link>
                    {card.isAddedByUser && (
                        <Text typo="body 2" color="secondary">
                            {t("added by you")}
                        </Text>
                    )}
                </div>
                {card.status === "connecting" ? (
                    <CircularProgress size={20} />
                ) : (
                    <ProviderStateChip state={card.status} />
                )}
            </div>

            {card.message !== undefined && (
                <Text
                    typo="body 1"
                    color={card.message.type === "connected as" ? "primary" : "secondary"}
                >
                    {(() => {
                        switch (card.message.type) {
                            case "connected as":
                                return t("connected as", {
                                    name: card.message.user.name,
                                    username: card.message.user.username
                                });
                            case "not connected":
                                return t("not connected");
                            case "error":
                                return t(card.message.reason);
                        }
                    })()}
                </Text>
            )}

            {card.gitIdentity !== undefined && (
                <div className={classes.gitIdentity}>
                    <Text typo="body 2" color="secondary">
                        {card.gitIdentity.email === undefined
                            ? t("git identity without email", {
                                  name: card.gitIdentity.name
                              })
                            : t("git identity", {
                                  name: card.gitIdentity.name,
                                  email: card.gitIdentity.email
                              })}
                    </Text>
                    {card.gitIdentity.isUsedAtLaunch && (
                        <Text typo="body 2" color="secondary">
                            {t("git identity used at launch")}
                        </Text>
                    )}
                </div>
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

            <div className={classes.footer}>
                {(() => {
                    switch (card.favorite) {
                        case "is favorite":
                            return (
                                <div className={classes.favorite}>
                                    <Icon icon={getIconUrlByName("Star")} size="small" />
                                    <Text typo="label 2">{t("favorite")}</Text>
                                </div>
                            );
                        case "can be set as favorite":
                            return (
                                <Button
                                    variant="ternary"
                                    startIcon={getIconUrlByName("StarBorder")}
                                    onClick={onSetFavorite}
                                >
                                    {t("set as favorite")}
                                </Button>
                            );
                    }
                })()}

                <div className={classes.actions}>
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
                                return (
                                    <>
                                        {authentication.isReplaceButtonShown && (
                                            <Button
                                                variant="ternary"
                                                disabled={authentication.isDisabled}
                                                onClick={
                                                    onStartReplacingPersonalAccessToken
                                                }
                                            >
                                                {t("replace")}
                                            </Button>
                                        )}
                                        {authentication.isCancelButtonShown && (
                                            <Button
                                                variant="ternary"
                                                disabled={authentication.isDisabled}
                                                onClick={
                                                    onCancelReplacingPersonalAccessToken
                                                }
                                            >
                                                {t("cancel")}
                                            </Button>
                                        )}
                                        {authentication.isRemoveButtonShown && (
                                            <Button
                                                variant="secondary"
                                                disabled={authentication.isDisabled}
                                                onClick={onRemovePersonalAccessToken}
                                            >
                                                {t("remove")}
                                            </Button>
                                        )}
                                    </>
                                );
                        }
                    })()}
                </div>
            </div>
        </section>
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

function CardErrorMessage(props: { error: CardError; providerName: string }) {
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
        minWidth: 0
    },
    logo: {
        width: 48,
        height: 48,
        flexShrink: 0,
        objectFit: "contain",
        borderRadius: theme.spacing(2.5)
    },
    logoFallback: {
        flexShrink: 0,
        color: theme.colors.useCases.typography.textSecondary
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
    gitIdentity: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5),
        marginTop: -theme.spacing(2)
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
    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: theme.spacing(2),
        marginTop: "auto"
    },
    favorite: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        color: theme.colors.useCases.typography.textFocus
    },
    actions: {
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(2),
        marginLeft: "auto"
    }
}));

const { i18n } = declareComponentKeys<
    | { K: "connected as"; P: { name: string; username: string } }
    | "not connected"
    | { K: "git identity"; P: { name: string; email: string } }
    | { K: "git identity without email"; P: { name: string } }
    | "git identity used at launch"
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
    | "favorite"
    | "set as favorite"
>()({ GitProviderCard });
export type I18n = typeof i18n;
