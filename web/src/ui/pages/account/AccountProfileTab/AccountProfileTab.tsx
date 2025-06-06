import { memo, Suspense, lazy } from "react";
import { useTranslation } from "ui/i18n";
import { SettingField } from "ui/shared/SettingField";
import { useCoreState, useCore } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { declareComponentKeys } from "i18nifty";
import { assert } from "tsafe/assert";
import { Button } from "onyxia-ui/Button";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";

const UserProfileForm = lazy(() => import("./UserProfileForm"));

export type Props = {
    className?: string;
};

export const AccountProfileTab = memo((props: Props) => {
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

    const { userAuthentication, userProfileForm } = useCore().functions;

    return (
        <div className={className}>
            <SettingSectionHeader
                title={t("account id")}
                helperText={t("account id helper")}
            />

            <SettingField
                type="text"
                title={t("user id")}
                text={user.username}
                onRequestCopy={onRequestCopyFactory(user.username)}
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
            {userProfileForm.getIsEnabled() && (
                <Suspense>
                    <UserProfileForm />
                </Suspense>
            )}
        </div>
    );
});

const { i18n } = declareComponentKeys<
    "user id" | "email" | "account management" | "account id" | "account id helper"
>()({
    AccountProfileTab
});
export type I18n = typeof i18n;
