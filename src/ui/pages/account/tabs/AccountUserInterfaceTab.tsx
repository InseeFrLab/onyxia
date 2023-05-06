import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useIsDarkModeEnabled } from "onyxia-ui";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useCoreFunctions, useCoreState, selectors } from "core";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
};

export const AccountUserInterfaceTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountUserInterfaceTab });

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();

    const onRequestToggleIsDarkModeEnabled = useConstCallback(() =>
        setIsDarkModeEnabled(!isDarkModeEnabled)
    );

    const { userConfigs } = useCoreFunctions();

    const {
        userConfigs: { isBetaModeEnabled, isDevModeEnabled }
    } = useCoreState(selectors.userConfigs.userConfigs);

    const onRequestToggleIsBetaModeEnabled = useConstCallback(() => {
        const isBetaModeEnabledNew = !isBetaModeEnabled;

        userConfigs.changeValue({
            "key": "isBetaModeEnabled",
            "value": isBetaModeEnabledNew
        });

        if (!isBetaModeEnabledNew) {
            userConfigs.changeValue({
                "key": "isDevModeEnabled",
                "value": false
            });
        }
    });

    const onRequestToggleIsDevModeEnabled = useConstCallback(() =>
        userConfigs.changeValue({
            "key": "isDevModeEnabled",
            "value": !isDevModeEnabled
        })
    );

    return (
        <div className={className}>
            <AccountSectionHeader title={t("title")} />
            <AccountField
                type="toggle"
                title={t("enable dark mode")}
                helperText={t("dark mode helper")}
                isLocked={false}
                isOn={isDarkModeEnabled}
                onRequestToggle={onRequestToggleIsDarkModeEnabled}
            />
            <AccountField
                type="toggle"
                title={t("enable beta")}
                helperText={t("beta mode helper")}
                isLocked={false}
                isOn={isBetaModeEnabled}
                onRequestToggle={onRequestToggleIsBetaModeEnabled}
            />
            {isBetaModeEnabled && (
                <AccountField
                    type="toggle"
                    title={t("enable dev mode")}
                    helperText={t("dev mode helper")}
                    isLocked={false}
                    isOn={isDevModeEnabled}
                    onRequestToggle={onRequestToggleIsDevModeEnabled}
                />
            )}
            <AccountField
                type="reset helper dialogs"
                onResetHelperDialogsClick={userConfigs.resetHelperDialogs}
            />
            <AccountField type="language" />
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "title"
    | "enable dark mode"
    | "enable beta"
    | "dark mode helper"
    | "beta mode helper"
    | "enable dev mode"
    | "dev mode helper"
>()({ AccountUserInterfaceTab });
