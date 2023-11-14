import { memo, useMemo } from "react";
import { useTranslation } from "ui/i18n";
import { ButtonBar, type ButtonBarProps } from "onyxia-ui/ButtonBar";
import { declareComponentKeys } from "i18nifty";

const buttonIds = ["refresh", "launch", "trash"] as const;

export type ButtonId = (typeof buttonIds)[number];

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
        (): ButtonBarProps<ButtonId>["buttons"] =>
            buttonIds.map(buttonId => ({
                buttonId,
                "icon": (() => {
                    switch (buttonId) {
                        case "refresh":
                            return "cached" as const;
                        case "launch":
                            return "add" as const;
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
                    })()
                )
            })),
        [t, isThereNonOwnedServicesShown, isThereDeletableServices]
    );

    return <ButtonBar className={className} buttons={buttons} onClick={onClick} />;
});

export const { i18n } = declareComponentKeys<
    "refresh" | "launch" | "trash" | "trash my own"
>()({
    MyServicesButtonBar
});
