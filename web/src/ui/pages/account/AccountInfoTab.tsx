import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { SettingField } from "ui/shared/SettingField";
import { useCore, useCoreState } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
};

export const AccountInfoTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountInfoTab });

    const { userAccountManagement } = useCore().functions;

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const user = useCoreState("userAuthentication", "user");

    const fullName = `${user.firstName} ${user.familyName}`;

    /* prettier-ignore */
    const keycloakAccountConfigurationUrl = userAccountManagement.getPasswordResetUrl();

    const { classes } = useStyles();

    return (
        <div className={className}>
            <SettingSectionHeader title={t("general information")} />
            <SettingField
                type="text"
                title={t("user id")}
                text={user.username}
                onRequestCopy={onRequestCopyFactory(user.username)}
            />
            <SettingField
                type="text"
                title={t("full name")}
                text={fullName}
                onRequestCopy={onRequestCopyFactory(fullName)}
            />
            <SettingField
                type="text"
                title={t("email")}
                text={user.email}
                onRequestCopy={onRequestCopyFactory(user.email)}
            />
            {keycloakAccountConfigurationUrl !== undefined && (
                <Link
                    className={classes.link}
                    href={keycloakAccountConfigurationUrl}
                    target="_blank"
                    underline="hover"
                >
                    {t("change account info")}
                </Link>
            )}
            <Divider className={classes.divider} variant="middle" />
            <SettingSectionHeader
                title={t("auth information")}
                helperText={t("auth information helper")}
            />
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "general information"
    | "user id"
    | "full name"
    | "email"
    | "change account info"
    | "auth information"
    | "auth information helper"
    | "ip address"
>()({ AccountInfoTab });

const useStyles = tss.withName({ AccountInfoTab }).create(({ theme }) => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4)
    },
    "link": {
        "marginTop": theme.spacing(2),
        "display": "inline-block"
    }
}));
