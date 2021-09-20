import { useEffect, useMemo, memo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useAppConstants, useSelector, useDispatch } from "app/interfaceWithLib/hooks";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "app/tools/copyToClipboard";
import Divider from "@material-ui/core/Divider";
import Link from "@material-ui/core/Link";
import { getEnv } from "env";
import { urlJoin } from "url-join-ts";
import { thunks } from "lib/setup";
import { useConstCallback } from "powerhooks/useConstCallback";
import { smartTrim } from "app/tools/smartTrim";
import { makeStyles } from "app/theme";
import { thunks as publicIpThunks } from "lib/useCases/publicIp";

export type Props = {
    className?: string;
};

const useStyles = makeStyles()(theme => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4),
    },
    "link": {
        "marginTop": theme.spacing(2),
        "display": "inline-block",
    },
}));

export const AccountInfoTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation("AccountInfoTab");

    const { parsedJwt } = useAppConstants({ "assertIsUserLoggedInIs": true });

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy),
    );

    const publicIp = useSelector(state => state.publicIp) ?? "Loading...";

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(publicIpThunks.fetch());
    }, []);

    const userServicePasswordState = useSelector(
        state => state.userConfigs.userServicePassword,
    );

    const onRequestServicePasswordRenewal = useConstCallback(() =>
        dispatch(thunks.userConfigs.renewUserServicePassword()),
    );

    const fullName = `${parsedJwt.given_name} ${parsedJwt.family_name}`;

    const tokenState = useSelector(state => state.tokens);

    const appConstants = useAppConstants({ "assertIsUserLoggedInIs": true });

    const accessTokenRemainingValidityMs = useMemo(
        () => appConstants.getOidcTokensRemandingValidityMs(),
        [tokenState.oidcTokens.accessToken],
    );

    const onRequestOidcAccessTokenRenewal = useConstCallback(() =>
        appConstants.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired({
            "minValidityMs": Infinity,
        }),
    );

    const { classes } = useStyles();

    return (
        <div className={className}>
            <AccountSectionHeader title={t("general information")} />
            <AccountField
                type="text"
                title={t("user id")}
                text={parsedJwt.preferred_username}
                onRequestCopy={onRequestCopyFactory(parsedJwt.preferred_username)}
            />
            <AccountField
                type="text"
                title={t("full name")}
                text={fullName}
                onRequestCopy={onRequestCopyFactory(fullName)}
            />
            <AccountField
                type="text"
                title={t("email")}
                text={parsedJwt.email}
                onRequestCopy={onRequestCopyFactory(parsedJwt.email)}
            />
            {getEnv().OIDC_URL !== "" && (
                <Link
                    className={classes.link}
                    href={urlJoin(
                        getEnv().OIDC_URL,
                        "realms",
                        getEnv().OIDC_REALM,
                        "account/password",
                    )}
                    target="_blank"
                    underline="hover"
                >
                    {t("password")}
                </Link>
            )}
            <Divider className={classes.divider} variant="middle" />
            <AccountSectionHeader
                title={t("auth information")}
                helperText={t("auth information helper")}
            />
            <AccountField
                type="service password"
                isLocked={userServicePasswordState.isBeingChanged}
                servicePassword={userServicePasswordState.value}
                onRequestCopy={onRequestCopyFactory(userServicePasswordState.value)}
                onRequestServicePasswordRenewal={onRequestServicePasswordRenewal}
            />
            <AccountField
                type="OIDC Access token"
                isLocked={tokenState.areTokensBeingRefreshed}
                remainingValidityMs={accessTokenRemainingValidityMs}
                oidcAccessToken={smartTrim({
                    "maxLength": 50,
                    "minCharAtTheEnd": 20,
                    "text": tokenState.oidcTokens.accessToken,
                })}
                onRequestOidcAccessTokenRenewal={onRequestOidcAccessTokenRenewal}
                onRequestCopy={onRequestCopyFactory(tokenState.oidcTokens.accessToken)}
            />
            <AccountField
                type="text"
                title={t("ip address")}
                text={publicIp}
                onRequestCopy={onRequestCopyFactory(publicIp)}
            />
        </div>
    );
});

export declare namespace AccountInfoTab {
    export type I18nScheme = {
        "general information": undefined;
        "user id": undefined;
        "full name": undefined;
        "email": undefined;
        "password": undefined;
        "auth information": undefined;
        "auth information helper": undefined;
        "ip address": undefined;
    };
}
