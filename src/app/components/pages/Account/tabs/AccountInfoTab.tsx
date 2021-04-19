
import { useMemo, memo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useAppConstants, useSelector, useDispatch } from "app/interfaceWithLib/hooks";
import { useCallbackFactory } from "powerhooks";
import { copyToClipboard } from "app/tools/copyToClipboard";
import Divider from "@material-ui/core/Divider";
import Link from "@material-ui/core/Link";
import { getValidatedEnv } from "app/validatedEnv";
import { urlJoin } from 'url-join-ts';
import { thunks } from "lib/setup";
import { useConstCallback } from "powerhooks";
import { usePublicIp } from "app/tools/usePublicIp";
import { smartTrim } from "app/tools/smartTrim";
import { createUseClassNames } from "app/theme/useClassNames";

export type Props = {
    className?: string;
};

const { useClassNames } = createUseClassNames()(
    theme => ({
        "divider": {
            "margin": theme.spacing(3, 0)
        },
        "link": {
            "marginTop": theme.spacing(1),
            "display": "inline-block"
        }

    })
);

export const AccountInfoTab = memo((props: Props) => {

    const { className } = props;

    const { t } = useTranslation("AccountInfoTab");

    const { parsedJwt } = useAppConstants({ "assertIsUserLoggedInIs": true });

    const onRequestCopyFactory = useCallbackFactory(
        ([textToCopy]: [string]) => copyToClipboard(textToCopy)
    );

    const dispatch = useDispatch();

    //We make the assumption that if we use OIDC we are using keycloak
    //...which is not necessarily the case.
    const keycloakConfig = (() => {

        const { AUTHENTICATION } = getValidatedEnv();

        return AUTHENTICATION.TYPE !== "oidc" ?
            undefined :
            AUTHENTICATION.OIDC;

    })();

    const userServicePasswordState = useSelector(state => state.userConfigs.userServicePassword);

    const onRequestServicePasswordRenewal = useConstCallback(
        () => dispatch(thunks.userConfigs.renewUserServicePassword())
    );

    const fullName = `${parsedJwt.given_name} ${parsedJwt.family_name}`;

    const tokenState = useSelector(state => state.tokens);

    const appConstants = useAppConstants({ "assertIsUserLoggedInIs": true });

    const accessTokenRemainingValidity = useMemo(
        () => appConstants.getOidcTokensRemandingValidity(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tokenState.oidcTokens.accessToken]
    );

    const onRequestOidcAccessTokenRenewal = useConstCallback(
        () => console.log("TODO: Trigger login")
        /*
        appConstants.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired(
            { "minValidity": Infinity }
        )
        */
    );

    const { publicIp } = usePublicIp();

    const { classNames } = useClassNames({});

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
            {keycloakConfig !== undefined &&
                <Link
                    className={classNames.link}
                    href={urlJoin(keycloakConfig.url, "realms", keycloakConfig.realm, "account/password")}
                    target="_blank"
                >
                    {t("password")}
                </Link>
            }
            <Divider className={classNames.divider} variant="middle" />
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
                remainingValidity={accessTokenRemainingValidity}
                oidcAccessToken={
                    smartTrim({
                        "maxLength": 50,
                        "minCharAtTheEnd": 20,
                        "text": tokenState.oidcTokens.accessToken
                    })
                }
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
        'general information': undefined;
        'user id': undefined;
        'full name': undefined;
        'email': undefined;
        'password': undefined;
        'auth information': undefined;
        'auth information helper': undefined;
        'ip address': undefined;
    };

}