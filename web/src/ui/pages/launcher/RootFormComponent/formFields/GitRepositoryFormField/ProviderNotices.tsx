import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import { Link } from "@mui/material";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { useTranslation } from "ui/i18n";
import type { DisconnectedProviderView } from "core/usecases/gitRepositoryFieldUiController";
import { CardErrorMessage } from "ui/pages/account/AccountGitTab/GitProviderCard";
import { ErrorAlert } from "ui/shared/ErrorAlert";
import { tss } from "tss";
import { getSharedStyles } from "./sharedStyles";

type ProviderCallbacks = {
    /** Must open the popup synchronously, it is called from the click handler */
    onSignIn: (params: { providerId: string }) => void;
    /** Opens the dialog where its token (and, added by the user, the rest) is edited */
    onManage: (params: { providerId: string }) => void;
};

/** What stopped working (or what the repository needs), and how to fix it */
export function ProviderToFix(
    props: ProviderCallbacks & {
        provider: DisconnectedProviderView;
        logoUrl: string;
        isReadonly: boolean;
        accountGitHref: string;
    }
) {
    const { provider, logoUrl, isReadonly, accountGitHref, onSignIn, onManage } = props;

    const { classes } = useStyles();
    const { t } = useTranslation("GitRepositoryFormField");
    const { t: t_card } = useTranslation("GitProviderCard");

    const { providerId, displayName, issue, error, action, isSigningIn } = provider;

    return (
        <div className={classes.providerToFix} role="alert">
            <Icon
                className={classes.providerToFixIcon}
                icon={getIconUrlByName("WarningAmber")}
                size="small"
            />
            <img className={classes.providerLogo} src={logoUrl} alt="" />
            <Text typo="body 2" className={classes.providerToFixMessage}>
                <span className={classes.name}>{displayName}</span>
                {" · "}
                {error !== undefined ? (
                    <CardErrorMessage error={error} providerName={displayName} />
                ) : issue === "not connected" ? (
                    t("provider not connected")
                ) : (
                    t_card(issue)
                )}
            </Text>
            {(() => {
                switch (action.type) {
                    // NOTE: Only the provider's settings get rid of a conflicting grant.
                    case "open account":
                        return (
                            <Link
                                className={classes.providerToFixAction}
                                href={accountGitHref}
                                underline="hover"
                            >
                                {t("fix in account")}
                            </Link>
                        );
                    case "manage":
                        return (
                            <Button
                                className={classes.providerToFixAction}
                                variant="secondary"
                                disabled={isReadonly}
                                onClick={() => onManage({ providerId })}
                            >
                                {t("manage")}
                            </Button>
                        );
                    case "sign in":
                        return (
                            <Button
                                className={classes.providerToFixAction}
                                variant="secondary"
                                disabled={isReadonly || isSigningIn}
                                onClick={() => onSignIn({ providerId })}
                            >
                                {t_card(
                                    issue === "not connected"
                                        ? "sign in"
                                        : "sign in again"
                                )}
                            </Button>
                        );
                }
            })()}
        </div>
    );
}

/** One click for OAuth, the manage dialog for a personal access token */
export function ProviderToOffer(
    props: ProviderCallbacks & { provider: DisconnectedProviderView; logoUrl: string }
) {
    const { provider, logoUrl, onSignIn, onManage } = props;

    const { classes } = useStyles();

    const { providerId, displayName, connectionMethod, isSigningIn } = provider;

    return (
        <ButtonBase
            className={classes.providerToOffer}
            disabled={isSigningIn}
            onClick={() =>
                connectionMethod === "oauth"
                    ? onSignIn({ providerId })
                    : onManage({ providerId })
            }
        >
            {isSigningIn ? (
                <CircularProgress size={16} />
            ) : (
                <img className={classes.providerLogo} src={logoUrl} alt="" />
            )}
            {displayName}
        </ButtonBase>
    );
}

/** Above the repositories of a provider that isn't connected: why, and what to do */
export function ProviderNotice(
    props: ProviderCallbacks & {
        provider: DisconnectedProviderView;
        isReadonly: boolean;
        accountGitHref: string;
    }
) {
    const { provider, isReadonly, accountGitHref, onSignIn, onManage } = props;

    const { t } = useTranslation("GitRepositoryFormField");
    const { t: t_card } = useTranslation("GitProviderCard");

    const { providerId, displayName: providerName, error, issue } = provider;

    const action = {
        isDisabled: isReadonly || provider.isSigningIn,
        ...(() => {
            switch (provider.action.type) {
                case "open account":
                    return { label: t("open account"), href: accountGitHref };
                case "manage":
                    return {
                        label: t("manage"),
                        onClick: () => onManage({ providerId })
                    };
                case "sign in":
                    return {
                        label: t(provider.action.label),
                        onClick: () => onSignIn({ providerId })
                    };
            }
        })()
    };

    switch (provider.state) {
        case "to connect":
            return (
                <ErrorAlert
                    severity="info"
                    title={t("connect your account title")}
                    message={t(
                        provider.connectionMethod === "oauth"
                            ? "connect your account"
                            : "connect your account with a token"
                    )}
                    action={action}
                />
            );
        case "session expired":
            return (
                <ErrorAlert
                    severity="warning"
                    title={t("reconnect title", { providerName })}
                    message={t("session ended", { providerName })}
                    action={action}
                />
            );
        case "failed":
            return (
                <ErrorAlert
                    severity="error"
                    title={t("authentication failed")}
                    message={
                        error !== undefined ? (
                            <CardErrorMessage error={error} providerName={providerName} />
                        ) : (
                            t_card(issue === "not connected" ? "sign in failed" : issue)
                        )
                    }
                    action={action}
                />
            );
    }
}

const useStyles = tss.withName("ProviderNotices").create(({ theme }) => {
    const { providerLogo } = getSharedStyles({ theme });

    return {
        providerLogo,
        name: {
            fontWeight: 500
        },
        providerToFix: {
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: theme.spacing(2),
            padding: theme.spacing({ topBottom: 2, rightLeft: 3 }),
            borderRadius: 8,
            border: `1px solid ${theme.colors.useCases.alertSeverity.warning.main}`,
            backgroundColor: theme.colors.useCases.alertSeverity.warning.background
        },
        providerToFixAction: {
            flexShrink: 0,
            marginLeft: "auto"
        },
        providerToFixIcon: {
            color: theme.colors.useCases.alertSeverity.warning.main,
            flexShrink: 0
        },
        providerToFixMessage: {
            flex: "1 1 240px",
            minWidth: 0
        },
        providerToOffer: {
            ...theme.typography.variants["body 2"].style,
            gap: theme.spacing(2),
            padding: theme.spacing({ topBottom: 1, rightLeft: 3 }),
            borderRadius: 999,
            color: theme.colors.useCases.typography.textPrimary,
            border: `1px solid ${theme.colors.useCases.surfaces.surface3}`,
            "&:hover, &.Mui-focusVisible": {
                color: theme.colors.useCases.typography.textFocus,
                borderColor: theme.colors.useCases.typography.textFocus,
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
            }
        }
    };
});
