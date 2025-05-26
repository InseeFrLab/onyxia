import { memo, Suspense, lazy } from "react";
import { useTranslation } from "ui/i18n";
import { SettingField } from "ui/shared/SettingField";
import { useCoreState, useCore } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { declareComponentKeys } from "i18nifty";
import { assert } from "tsafe/assert";
import { Button } from "onyxia-ui/Button";

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
            <SettingField
                type="text"
                title={t("user id")}
                text={user.username}
                onRequestCopy={onRequestCopyFactory(user.username)}
            />
            {(() => {
                const fullName = (() => {
                    if (user.firstName === undefined || user.familyName === undefined) {
                        return undefined;
                    }

                    return `${user.firstName} ${user.familyName}`;
                })();

                if (fullName === undefined) {
                    return null;
                }

                return (
                    <SettingField
                        type="text"
                        title={t("full name")}
                        text={fullName}
                        onRequestCopy={onRequestCopyFactory(fullName)}
                    />
                );
            })()}
            {userProfileForm.getIsEnabled() && (
                <Suspense>
                    <UserProfileForm />
                </Suspense>
            )}
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

const { i18n } = declareComponentKeys<
    "user id" | "full name" | "email" | "account management"
>()({
    AccountProfileTab
});
export type I18n = typeof i18n;
