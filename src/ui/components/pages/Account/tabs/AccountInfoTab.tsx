import { useEffect, useReducer, memo } from "react";
import { useTranslation } from "ui/i18n/useTranslations";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useSelector, useThunks } from "ui/coreApi";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import { getEnv } from "env";
import { urlJoin } from "url-join-ts";
import { useConstCallback } from "powerhooks/useConstCallback";
import { makeStyles } from "ui/theme";
import { useAsync } from "react-async-hook";

export type Props = {
    className?: string;
};

export const AccountInfoTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountInfoTab });

    const { publicIpThunks, projectConfigsThunks, userAuthenticationThunks } =
        useThunks();

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy),
    );

    const publicIp = useSelector(state => state.publicIp) ?? "Loading...";

    useEffect(() => {
        publicIpThunks.fetch();
    }, []);

    const [refreshServicePasswordTrigger, pullRefreshServicePasswordTrigger] = useReducer(
        n => n + 1,
        0,
    );

    const servicePasswordAsync = useAsync(
        () => projectConfigsThunks.getValue({ "key": "servicePassword" }),
        [refreshServicePasswordTrigger],
    );

    const onRequestServicePasswordRenewal = useConstCallback(async () => {
        await projectConfigsThunks.renewServicePassword();

        pullRefreshServicePasswordTrigger();
    });

    const user = userAuthenticationThunks.getUser();

    const fullName = `${user.firstName} ${user.familyName}`;

    const { classes } = useStyles();

    return (
        <div className={className}>
            <AccountSectionHeader title={t("general information")} />
            <AccountField
                type="text"
                title={t("user id")}
                text={user.username}
                onRequestCopy={onRequestCopyFactory(user.username)}
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
                text={user.email}
                onRequestCopy={onRequestCopyFactory(user.email)}
            />
            {getEnv().OIDC_URL !== "" && (
                <Link
                    className={classes.link}
                    href={urlJoin(
                        getEnv().OIDC_URL,
                        "realms",
                        getEnv().OIDC_REALM,
                        "account",
                    )}
                    target="_blank"
                    underline="hover"
                >
                    {t("change account info")}
                </Link>
            )}
            <Divider className={classes.divider} variant="middle" />
            <AccountSectionHeader
                title={t("auth information")}
                helperText={t("auth information helper")}
            />
            <AccountField
                type="service password"
                isLocked={servicePasswordAsync.loading}
                servicePassword={servicePasswordAsync.result ?? "⏳"}
                onRequestCopy={
                    servicePasswordAsync.result === undefined
                        ? () => {}
                        : onRequestCopyFactory(servicePasswordAsync.result)
                }
                onRequestServicePasswordRenewal={onRequestServicePasswordRenewal}
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
        "change account info": undefined;
        "auth information": undefined;
        "auth information helper": undefined;
        "ip address": undefined;
    };
}

const useStyles = makeStyles({ "name": { AccountInfoTab } })(theme => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4),
    },
    "link": {
        "marginTop": theme.spacing(2),
        "display": "inline-block",
    },
}));
