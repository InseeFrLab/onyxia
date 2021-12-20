import { memo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useIsDarkModeEnabled } from "onyxia-ui";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useThunks, useSelector, selectors } from "app/libApi";

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
        userConfigs: { isBetaModeEnabled },
    } = useSelector(selectors.userConfigs.userConfigs);

    const onRequestToggleIsBetaModeEnabled = useConstCallback(() =>
        userConfigsThunks.changeValue({
            "key": "isBetaModeEnabled",
            "value": !isBetaModeEnabled,
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
    };
}
