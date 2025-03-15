import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { SettingField } from "ui/shared/SettingField";
import { useDarkMode } from "onyxia-ui";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useCore, useCoreState } from "core";
import { declareComponentKeys } from "i18nifty";
import { env } from "env";

export type Props = {
    className?: string;
};

const AccountUserInterfaceTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountUserInterfaceTab });

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useDarkMode();

    const onRequestToggleIsDarkModeEnabled = useConstCallback(() =>
        setIsDarkModeEnabled(!isDarkModeEnabled)
    );

    const { userConfigs } = useCore().functions;

    const { isBetaModeEnabled, isDevModeEnabled, isCommandBarEnabled } = useCoreState(
        "userConfigs",
        "userConfigs"
    );

    const onRequestToggleIsBetaModeEnabled = useConstCallback(() => {
        const isBetaModeEnabledNew = !isBetaModeEnabled;

        userConfigs.changeValue({
            key: "isBetaModeEnabled",
            value: isBetaModeEnabledNew
        });

        if (!isBetaModeEnabledNew) {
            userConfigs.changeValue({
                key: "isDevModeEnabled",
                value: false
            });
        }
    });

    const onRequestToggleIsDevModeEnabled = useConstCallback(() =>
        userConfigs.changeValue({
            key: "isDevModeEnabled",
            value: !isDevModeEnabled
        })
    );

    const onRequestToggleIsCommandBarEnabled = useConstCallback(() =>
        userConfigs.changeValue({
            key: "isCommandBarEnabled",
            value: !isCommandBarEnabled
        })
    );

    return (
        <div className={className}>
            <SettingSectionHeader title={t("title")} />
            {env.DARK_MODE === undefined && (
                <SettingField
                    type="toggle"
                    title={t("enable dark mode")}
                    helperText={t("dark mode helper")}
                    isLocked={false}
                    isOn={isDarkModeEnabled}
                    onRequestToggle={onRequestToggleIsDarkModeEnabled}
                />
            )}
            <SettingField
                type="toggle"
                title={t("enable beta")}
                helperText={t("beta mode helper")}
                isLocked={false}
                isOn={isBetaModeEnabled}
                onRequestToggle={onRequestToggleIsBetaModeEnabled}
            />
            {isBetaModeEnabled && (
                <SettingField
                    type="toggle"
                    title={t("enable dev mode")}
                    helperText={t("dev mode helper")}
                    isLocked={false}
                    isOn={isDevModeEnabled}
                    onRequestToggle={onRequestToggleIsDevModeEnabled}
                />
            )}
            <SettingField
                type="toggle"
                title={t("Enable command bar")}
                helperText={t("Enable command bar helper", {
                    imgUrl: "https://github.com/InseeFrLab/onyxia/assets/6702424/474da82c-a0e1-4107-acf7-84870aab9f78"
                })}
                isLocked={false}
                isOn={isCommandBarEnabled}
                onRequestToggle={onRequestToggleIsCommandBarEnabled}
            />
            <SettingField
                type="reset helper dialogs"
                onResetHelperDialogsClick={userConfigs.resetHelperDialogs}
            />
            <SettingField type="language" />
        </div>
    );
});

export default AccountUserInterfaceTab;

const { i18n } = declareComponentKeys<
    | "title"
    | "enable dark mode"
    | "enable beta"
    | "dark mode helper"
    | "beta mode helper"
    | "enable dev mode"
    | "dev mode helper"
    | "Enable command bar"
    | {
          K: "Enable command bar helper";
          P: {
              imgUrl: string;
          };
          R: JSX.Element;
      }
>()({ AccountUserInterfaceTab });
export type I18n = typeof i18n;
