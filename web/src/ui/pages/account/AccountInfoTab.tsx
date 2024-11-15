import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { SettingField } from "ui/shared/SettingField";
import { useCoreState } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    className?: string;
};

export const AccountInfoTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountInfoTab });

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const user = useCoreState("userAuthentication", "user");

    const fullName = `${user.firstName} ${user.familyName}`;

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
            <Text typo="body 2" className={classes.howToChangePasswordInfo}>
                <Icon icon={getIconUrlByName("Info")} />
                &nbsp;
                {t("instructions about how to change password")}
            </Text>
        </div>
    );
});

const { i18n } = declareComponentKeys<
    | "general information"
    | "user id"
    | "full name"
    | "email"
    | "instructions about how to change password"
>()({ AccountInfoTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountInfoTab }).create(({ theme }) => ({
    howToChangePasswordInfo: {
        marginTop: theme.spacing(4),
        display: "flex",
        alignItems: "center"
    }
}));
