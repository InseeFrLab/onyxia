import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import { Link } from "@mui/material";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { useTranslation } from "ui/i18n";
import type { DisconnectedForgeView } from "core/usecases/gitRepositoryFieldUiController";
import { CardErrorMessage } from "ui/pages/account/AccountGitTab/GitForgeCard";
import { ErrorAlert } from "ui/shared/ErrorAlert";
import { tss } from "tss";
import { getSharedStyles } from "./sharedStyles";

type ForgeCallbacks = {
    /** Must open the popup synchronously, it is called from the click handler */
    onSignIn: (params: { forgeId: string }) => void;
    /** Opens the dialog where its token (and, added by the user, the rest) is edited */
    onManage: (params: { forgeId: string }) => void;
};

/** What stopped working (or what the repository needs), and how to fix it */
export function ForgeToFix(
    props: ForgeCallbacks & {
        forge: DisconnectedForgeView;
        logoUrl: string;
        isReadonly: boolean;
        accountGitHref: string;
    }
) {
    const { forge, logoUrl, isReadonly, accountGitHref, onSignIn, onManage } = props;

    const { classes } = useStyles();
    const { t } = useTranslation("GitRepositoryFormField");
    const { t: t_card } = useTranslation("GitForgeCard");

    const { forgeId, displayName, issue, error, action, isSigningIn } = forge;

    return (
        <div className={classes.forgeToFix} role="alert">
            <Icon
                className={classes.forgeToFixIcon}
                icon={getIconUrlByName("WarningAmber")}
                size="small"
            />
            <img className={classes.forgeLogo} src={logoUrl} alt="" />
            <Text typo="body 2" className={classes.forgeToFixMessage}>
                <span className={classes.name}>{displayName}</span>
                {" · "}
                {error !== undefined ? (
                    <CardErrorMessage error={error} forgeName={displayName} />
                ) : issue === "not connected" ? (
                    t("forge not connected")
                ) : (
                    t_card(issue)
                )}
            </Text>
            {(() => {
                switch (action.type) {
                    // NOTE: Only the forge's settings get rid of a conflicting grant.
                    case "open account":
                        return (
                            <Link
                                className={classes.forgeToFixAction}
                                href={accountGitHref}
                                underline="hover"
                            >
                                {t("fix in account")}
                            </Link>
                        );
                    case "manage":
                        return (
                            <Button
                                className={classes.forgeToFixAction}
                                variant="secondary"
                                disabled={isReadonly}
                                onClick={() => onManage({ forgeId })}
                            >
                                {t("manage")}
                            </Button>
                        );
                    case "sign in":
                        return (
                            <Button
                                className={classes.forgeToFixAction}
                                variant="secondary"
                                disabled={isReadonly || isSigningIn}
                                onClick={() => onSignIn({ forgeId })}
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
export function ForgeToOffer(
    props: ForgeCallbacks & { forge: DisconnectedForgeView; logoUrl: string }
) {
    const { forge, logoUrl, onSignIn, onManage } = props;

    const { classes } = useStyles();

    const { forgeId, displayName, connectionMethod, isSigningIn } = forge;

    return (
        <ButtonBase
            className={classes.forgeToOffer}
            disabled={isSigningIn}
            onClick={() =>
                connectionMethod === "oauth"
                    ? onSignIn({ forgeId })
                    : onManage({ forgeId })
            }
        >
            {isSigningIn ? (
                <CircularProgress size={16} />
            ) : (
                <img className={classes.forgeLogo} src={logoUrl} alt="" />
            )}
            {displayName}
        </ButtonBase>
    );
}

/** Above the repositories of a forge that isn't connected: why, and what to do */
export function ForgeNotice(
    props: ForgeCallbacks & {
        forge: DisconnectedForgeView;
        isReadonly: boolean;
        accountGitHref: string;
    }
) {
    const { forge, isReadonly, accountGitHref, onSignIn, onManage } = props;

    const { t } = useTranslation("GitRepositoryFormField");
    const { t: t_card } = useTranslation("GitForgeCard");

    const { forgeId, displayName: forgeName, error, issue } = forge;

    const action = {
        isDisabled: isReadonly || forge.isSigningIn,
        ...(() => {
            switch (forge.action.type) {
                case "open account":
                    return { label: t("open account"), href: accountGitHref };
                case "manage":
                    return {
                        label: t("manage"),
                        onClick: () => onManage({ forgeId })
                    };
                case "sign in":
                    return {
                        label: t(forge.action.label),
                        onClick: () => onSignIn({ forgeId })
                    };
            }
        })()
    };

    switch (forge.state) {
        case "to connect":
            return (
                <ErrorAlert
                    severity="info"
                    title={t("connect your account title")}
                    message={t(
                        forge.connectionMethod === "oauth"
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
                    title={t("reconnect title", { forgeName })}
                    message={t("session ended", { forgeName })}
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
                            <CardErrorMessage error={error} forgeName={forgeName} />
                        ) : (
                            t_card(issue === "not connected" ? "sign in failed" : issue)
                        )
                    }
                    action={action}
                />
            );
    }
}

const useStyles = tss.withName("ForgeNotices").create(({ theme }) => {
    const { forgeLogo } = getSharedStyles({ theme });

    return {
        forgeLogo,
        name: {
            fontWeight: 500
        },
        forgeToFix: {
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: theme.spacing(2),
            padding: theme.spacing({ topBottom: 2, rightLeft: 3 }),
            borderRadius: 8,
            border: `1px solid ${theme.colors.useCases.alertSeverity.warning.main}`,
            backgroundColor: theme.colors.useCases.alertSeverity.warning.background
        },
        forgeToFixAction: {
            flexShrink: 0,
            marginLeft: "auto"
        },
        forgeToFixIcon: {
            color: theme.colors.useCases.alertSeverity.warning.main,
            flexShrink: 0
        },
        forgeToFixMessage: {
            flex: "1 1 240px",
            minWidth: 0
        },
        forgeToOffer: {
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
