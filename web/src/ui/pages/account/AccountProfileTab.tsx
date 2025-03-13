import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingField } from "ui/shared/SettingField";
import { useCoreState, useCore } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { assert } from "tsafe/assert";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    className?: string;
};

const AccountProfileTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountProfileTab });

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const { isUserLoggedIn, user, providerSpecific } = useCoreState(
        "userAuthentication",
        "main"
    );

    assert(isUserLoggedIn);

    const fullName = `${user.firstName} ${user.familyName}`;

    const { kcChangePassword, kcDeleteAccount, kcUpdateProfile } =
        useCore().functions.userAuthentication;

    const { classes } = useStyles();

    return (
        <div className={className}>
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
            {providerSpecific.type === "keycloak" && (
                <div className={classes.buttonWrapper}>
                    <Button onClick={() => kcUpdateProfile()}>
                        {t("update profile")}
                    </Button>
                    {providerSpecific.actionResult?.kc_action === "UPDATE_PROFILE" && (
                        <Text typo="body 2" className={classes.feedback}>
                            <Icon icon={getIconUrlByName("Info")} />
                            &nbsp;
                            {t("profile update feedback", {
                                isSuccess: providerSpecific.actionResult.isSuccess
                            })}
                        </Text>
                    )}

                    <Button onClick={() => kcChangePassword()}>
                        {t("change password")}
                    </Button>
                    {providerSpecific.actionResult?.kc_action === "CHANGE_PASSWORD" && (
                        <Text typo="body 2" className={classes.feedback}>
                            <Icon icon={getIconUrlByName("Info")} />
                            &nbsp;
                            {t("profile update feedback", {
                                isSuccess: providerSpecific.actionResult.isSuccess
                            })}
                        </Text>
                    )}

                    <Button
                        onClick={() => kcDeleteAccount()}
                        className={classes.dangerButton}
                        variant="ternary"
                    >
                        {t("delete account")}
                    </Button>
                </div>
            )}
        </div>
    );
});

export default AccountProfileTab;

const { i18n } = declareComponentKeys<
    | "user id"
    | "full name"
    | "email"
    | "update profile"
    | "change password"
    | "delete account"
    | { K: "profile update feedback"; R: string; P: { isSuccess: boolean } }
    | { K: "password update feedback"; R: string; P: { isSuccess: boolean } }
>()({ AccountProfileTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountProfileTab }).create(({ theme }) => ({
    buttonWrapper: {
        display: "inline-flex",
        gap: theme.spacing(2)
    },
    dangerButton: {
        color: theme.colors.useCases.alertSeverity.error.main,
        backgroundColor: theme.colors.useCases.alertSeverity.error.background
    },
    feedback: {
        marginTop: theme.spacing(4),
        display: "flex",
        alignItems: "center"
    }
}));
