import { memo, useMemo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { ButtonBar } from "app/theme";
import type { IconId } from "app/theme";
import type { ButtonBarProps } from "onyxia-ui/ButtonBar";

const buttonIds = ["refresh", "launch", "password", "trash"] as const;

export type ButtonId = typeof buttonIds[number];

export type Props = {
    className?: string;
    isThereNonOwnedServicesShown: boolean;
    isThereDeletableServices: boolean;
    onClick: (buttonId: ButtonId) => void;
};

export const MyServicesButtonBar = memo((props: Props) => {
    const { className, isThereNonOwnedServicesShown, isThereDeletableServices, onClick } =
        props;

    const { t } = useTranslation({ MyServicesButtonBar });

    const buttons = useMemo(
        (): ButtonBarProps<ButtonId, IconId>["buttons"] =>
            buttonIds.map(buttonId => ({
                buttonId,
                "icon": (() => {
                    switch (buttonId) {
                        case "refresh":
                            return "cached" as const;
                        case "launch":
                            return "add" as const;
                        case "password":
                            return "key" as const;
                        case "trash":
                            return "delete" as const;
                    }
                })(),
                "isDisabled": buttonId === "trash" && !isThereDeletableServices,
                "label": t(
                    (() => {
                        switch (buttonId) {
                            case "trash":
                                return isThereNonOwnedServicesShown
                                    ? "trash my own"
                                    : "trash";
                            default:
                                return buttonId;
                        }
                    })(),
                ),
            })),
        [t, isThereNonOwnedServicesShown, isThereDeletableServices],
    );

    return <ButtonBar className={className} buttons={buttons} onClick={onClick} />;
});

export declare namespace MyServicesButtonBar {
    export type I18nScheme = Record<ButtonId, undefined> & {
        "trash my own": undefined;
    };
}
