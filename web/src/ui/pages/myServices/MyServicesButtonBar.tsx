import { memo, useMemo } from "react";
import { useTranslation } from "ui/i18n";
import { ButtonBar, type ButtonBarProps } from "onyxia-ui/ButtonBar";
import { declareComponentKeys } from "i18nifty";
import { getIconUrlByName } from "lazy-icons";
import { Badge } from "@mui/material";

const buttonIds = ["refresh", "launch", "trash", "events"] as const;

export type ButtonId = (typeof buttonIds)[number];

export type Props = {
    className?: string;
    isThereNonOwnedServicesShown: boolean;
    isThereDeletableServices: boolean;
    eventsNotificationCount: number;
    onClick: (buttonId: ButtonId) => void;
};

export const MyServicesButtonBar = memo((props: Props) => {
    const {
        className,
        isThereNonOwnedServicesShown,
        isThereDeletableServices,
        eventsNotificationCount,
        onClick
    } = props;

    const { t } = useTranslation({ MyServicesButtonBar });

    const buttons = useMemo(
        (): ButtonBarProps<ButtonId>["buttons"] =>
            buttonIds.map(buttonId => ({
                buttonId,
                icon: (() => {
                    switch (buttonId) {
                        case "refresh":
                            return getIconUrlByName("Cached");
                        case "launch":
                            return getIconUrlByName("Add");
                        case "trash":
                            return getIconUrlByName("Delete");
                        case "events":
                            return getIconUrlByName("ManageSearch");
                    }
                })(),
                isDisabled: buttonId === "trash" && !isThereDeletableServices,
                label: (() => {
                    if (buttonId === "events") {
                        return (
                            <Badge
                                badgeContent={eventsNotificationCount}
                                color="primary"
                                sx={{
                                    ".MuiBadge-badge": {
                                        transform: "translate(20px, -50%)"
                                    }
                                }}
                            >
                                Events
                            </Badge>
                        );
                    }

                    if (buttonId === "trash") {
                        return isThereNonOwnedServicesShown
                            ? t("trash my own")
                            : t("trash");
                    }

                    return t(buttonId);
                })()
            })),
        [
            t,
            isThereNonOwnedServicesShown,
            isThereDeletableServices,
            eventsNotificationCount
        ]
    );

    return <ButtonBar className={className} buttons={buttons} onClick={onClick} />;
});

const { i18n } = declareComponentKeys<"refresh" | "launch" | "trash" | "trash my own">()({
    MyServicesButtonBar
});
export type I18n = typeof i18n;
