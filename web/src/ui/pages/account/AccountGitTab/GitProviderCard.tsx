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
import type { AccountView } from "core/usecases/gitAccountUiController";
import { OAuthAuthorizationError } from "core/ports/OAuthAuthorization";
import { ProviderStateChip, type ProviderState } from "../AccountAiTab/ProviderCard";
import { FormTextField } from "../AccountAiTab/shared/FormFields";

type Props = {
    className?: string;
    card: AccountView.ProviderCard;
    /** Must open the popup synchronously, it is called from the click handler */
    onSignIn: () => Promise<void>;
    onSignOut: () => Promise<void>;
    onSetPersonalAccessToken: (params: {
        personalAccessToken: string;
    }) => Promise<{ isAccepted: boolean }>;
    onRemovePersonalAccessToken: () => Promise<void>;
    onSetFavorite: () => void;
};

export function GitProviderCard(props: Props) {
    const {
        className,
        card,
        onSignIn,
        onSignOut,
        onSetPersonalAccessToken,
        onRemovePersonalAccessToken,
        onSetFavorite
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ GitProviderCard });
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();
    const { resolveLocalizedString } = useResolveLocalizedString();

    const { connection, authentication } = card;

    /** What went wrong with the last action, cleared by the next one */
    const [actionError, setActionError] = useState<string | undefined>(undefined);
    const [isBusy, setIsBusy] = useState(false);
    const [isRevocationHintShown, setIsRevocationHintShown] = useState(false);

    const [personalAccessToken, setPersonalAccessToken] = useState("");
    const [isReplacingToken, setIsReplacingToken] = useState(false);

    const runAction = (params: {
        action: () => Promise<void>;
        getErrorMessage: (error: unknown) => string;
    }) => {
        const { action, getErrorMessage } = params;

        setActionError(undefined);
        setIsRevocationHintShown(false);
        setIsBusy(true);

        // NOTE: Called synchronously, the sign in popup opens in the click handler.
        action()
            .catch(error => setActionError(getErrorMessage(error)))
            .finally(() => setIsBusy(false));
    };

    const submitPersonalAccessToken = () => {
        if (personalAccessToken.trim() === "") {
            return;
        }

        runAction({
            action: async () => {
                const { isAccepted } = await onSetPersonalAccessToken({
                    personalAccessToken
                });

                if (!isAccepted) {
                    throw new TokenRejectedError();
                }

                setPersonalAccessToken("");
                setIsReplacingToken(false);
            },
            getErrorMessage: error =>
                error instanceof TokenRejectedError
                    ? t("token rejected")
                    : t("token check failed")
        });
    };

    const getSignInErrorMessage = (error: unknown) => {
        if (error instanceof OAuthAuthorizationError) {
            switch (error.reason) {
                case "popup blocked":
                    return t("popup blocked");
                case "popup closed":
                    return t("sign in cancelled");
                case "denied":
                    return error.providerError === undefined
                        ? t("sign in denied")
                        : `${t("sign in denied")} (${error.providerError})`;
                case "timeout":
                    return t("sign in failed");
            }
        }
        return t("sign in failed");
    };

    const state: ProviderState = (() => {
        switch (connection.status) {
            case "connected":
                return "connected";
            case "error":
                return "connection error";
            case "not connected":
            case "connecting":
                return "setup required";
        }
    })();

    const isConnected = connection.status === "connected";

    const connectionMessage = (() => {
        switch (connection.status) {
            case "connected":
                return t("connected as", {
                    name: connection.user.name,
                    username: connection.user.username
                });
            case "not connected":
                return t("not connected");
            case "connecting":
                return undefined;
            case "error":
                switch (connection.reason) {
                    case "personal access token rejected":
                        return t("personal access token rejected");
                    case "session expired":
                        return t("session expired");
                    case "loading failed":
                        return t("loading failed");
                }
        }
    })();

    const isTokenFormShown =
        authentication.type === "personal-access-token" &&
        (!isConnected || isReplacingToken);

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
                </div>
                {connection.status === "connecting" ? (
                    <CircularProgress size={20} />
                ) : (
                    <ProviderStateChip state={state} />
                )}
            </div>

            {connectionMessage !== undefined && (
                <Text typo="body 1" color={isConnected ? "primary" : "secondary"}>
                    {connectionMessage}
                </Text>
            )}

            {connection.status === "connected" && (
                <div className={classes.gitIdentity}>
                    <Text typo="body 2" color="secondary">
                        {connection.user.email === undefined
                            ? t("git identity without email", {
                                  name: connection.user.name
                              })
                            : t("git identity", {
                                  name: connection.user.name,
                                  email: connection.user.email
                              })}
                    </Text>
                    {card.isFavorite && (
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

            {isTokenFormShown && authentication.type === "personal-access-token" && (
                <form
                    className={classes.tokenForm}
                    onSubmit={event => {
                        event.preventDefault();

                        submitPersonalAccessToken();
                    }}
                >
                    <FormTextField
                        label={t("personal access token")}
                        value={personalAccessToken}
                        onChange={setPersonalAccessToken}
                        autoComplete="off"
                        isSensitive={true}
                    />
                    <Link
                        className={classes.inlineLink}
                        href={authentication.personalAccessTokenCreationUrl}
                        target="_blank"
                        rel="noreferrer"
                        underline="hover"
                    >
                        {t("create a token", { providerName: card.displayName })}
                        <Icon icon={getIconUrlByName("OpenInNew")} size="extra small" />
                    </Link>
                </form>
            )}

            {actionError !== undefined && (
                <div role="alert">
                    <Text typo="body 2" className={classes.error}>
                        {actionError}
                    </Text>
                </div>
            )}

            {isRevocationHintShown &&
                authentication.type === "oauth" &&
                authentication.authorizedApplicationsUrl !== undefined && (
                    <Text typo="body 2" color="secondary">
                        {t("revoke on provider", { providerName: card.displayName })}{" "}
                        <Link
                            href={authentication.authorizedApplicationsUrl}
                            target="_blank"
                            rel="noreferrer"
                            underline="hover"
                        >
                            {t("authorized applications")}
                        </Link>
                    </Text>
                )}

            <div className={classes.footer}>
                {card.isFavorite ? (
                    <div className={classes.favorite}>
                        <Icon icon={getIconUrlByName("Star")} size="small" />
                        <Text typo="label 2">{t("favorite")}</Text>
                    </div>
                ) : (
                    <Button
                        variant="ternary"
                        startIcon={getIconUrlByName("StarBorder")}
                        onClick={onSetFavorite}
                    >
                        {t("set as favorite")}
                    </Button>
                )}

                <div className={classes.actions}>
                    {(() => {
                        switch (authentication.type) {
                            case "oauth":
                                return isConnected ? (
                                    <Button
                                        variant="secondary"
                                        disabled={isBusy}
                                        onClick={() =>
                                            runAction({
                                                action: async () => {
                                                    await onSignOut();
                                                    setIsRevocationHintShown(true);
                                                },
                                                getErrorMessage: () =>
                                                    t("sign out failed")
                                            })
                                        }
                                    >
                                        {t("sign out")}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        disabled={
                                            isBusy || connection.status === "connecting"
                                        }
                                        onClick={() =>
                                            runAction({
                                                action: onSignIn,
                                                getErrorMessage: getSignInErrorMessage
                                            })
                                        }
                                    >
                                        {connection.status === "error"
                                            ? t("sign in again")
                                            : t("sign in")}
                                    </Button>
                                );
                            case "personal-access-token":
                                return (
                                    <>
                                        {isConnected && !isReplacingToken && (
                                            <Button
                                                variant="ternary"
                                                disabled={isBusy}
                                                onClick={() => setIsReplacingToken(true)}
                                            >
                                                {t("replace")}
                                            </Button>
                                        )}
                                        {isReplacingToken && (
                                            <Button
                                                variant="ternary"
                                                disabled={isBusy}
                                                onClick={() => {
                                                    setIsReplacingToken(false);
                                                    setPersonalAccessToken("");
                                                    setActionError(undefined);
                                                }}
                                            >
                                                {t("cancel")}
                                            </Button>
                                        )}
                                        {connection.status !== "not connected" &&
                                            !isReplacingToken && (
                                                <Button
                                                    variant="secondary"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        runAction({
                                                            action: onRemovePersonalAccessToken,
                                                            getErrorMessage: () =>
                                                                t("remove failed")
                                                        })
                                                    }
                                                >
                                                    {t("remove")}
                                                </Button>
                                            )}
                                        {isTokenFormShown && (
                                            <Button
                                                variant="primary"
                                                disabled={
                                                    isBusy ||
                                                    personalAccessToken.trim() === ""
                                                }
                                                onClick={submitPersonalAccessToken}
                                            >
                                                {isBusy ? t("checking") : t("save")}
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

class TokenRejectedError extends Error {}

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
    | "authorized applications"
    | "personal access token"
    | { K: "create a token"; P: { providerName: string } }
    | "save"
    | "checking"
    | "replace"
    | "cancel"
    | "remove"
    | "remove failed"
    | "token rejected"
    | "token check failed"
    | "favorite"
    | "set as favorite"
>()({ GitProviderCard });
export type I18n = typeof i18n;
