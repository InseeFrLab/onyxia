import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingField } from "ui/shared/SettingField";
import { useCoreState, useCore } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { declareComponentKeys } from "i18nifty";
import { assert } from "tsafe/assert";
import { Button } from "onyxia-ui/Button";

export type Props = {
    className?: string;
};

const AccountProfileTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountProfileTab });

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const { isUserLoggedIn, user, isKeycloak } = useCoreState(
        "userAuthentication",
        "main"
    );

    assert(isUserLoggedIn);

    const fullName = `${user.firstName} ${user.familyName}`;

    const { userAuthentication } = useCore().functions;

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
            {isKeycloak && (
                <Button onClick={() => userAuthentication.kcRedirectToAccountConsole()}>
                    {t("account management")}
                </Button>
            )}
        </div>
    );
});

export default AccountProfileTab;

const { i18n } = declareComponentKeys<
    "user id" | "full name" | "email" | "account management"
>()({
    AccountProfileTab
});
export type I18n = typeof i18n;
