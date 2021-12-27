import { memo } from "react";
import { useTranslation } from "ui/i18n/useTranslations";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useIsDarkModeEnabled } from "onyxia-ui";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useThunks, useSelector, selectors } from "ui/coreApi";

export type Props = {
    className?: string;
};

export const AccountUserInterfaceTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountUserInterfaceTab });

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();

    const onRequestToggleIsDarkModeEnabled = useConstCallback(() =>
        setIsDarkModeEnabled(!isDarkModeEnabled),
    );

    const { userConfigsThunks } = useThunks();

    const {
        userConfigs: { isBetaModeEnabled, isDevModeEnabled },
    } = useSelector(selectors.userConfigs.userConfigs);

    const onRequestToggleIsBetaModeEnabled = useConstCallback(() => {
        const isBetaModeEnabledNew = !isBetaModeEnabled;

        userConfigsThunks.changeValue({
            "key": "isBetaModeEnabled",
            "value": isBetaModeEnabledNew,
        });

        if (!isBetaModeEnabledNew) {
            userConfigsThunks.changeValue({
                "key": "isDevModeEnabled",
                "value": false,
            });
        }
    });

    const onRequestToggleIsDevModeEnabled = useConstCallback(() =>
        userConfigsThunks.changeValue({
            "key": "isDevModeEnabled",
            "value": !isDevModeEnabled,
        }),
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
                onResetHelperDialogsClick={userConfigsThunks.resetHelperDialogs}
            />
            <AccountField type="language" />
        </div>
    );
});

export declare namespace AccountUserInterfaceTab {
    export type I18nScheme = {
        "title": undefined;
        "enable dark mode": undefined;
        "enable beta": undefined;
        "dark mode helper": undefined;
        "beta mode helper": undefined;
        "enable dev mode": undefined;
        "dev mode helper": undefined;
    };
}
