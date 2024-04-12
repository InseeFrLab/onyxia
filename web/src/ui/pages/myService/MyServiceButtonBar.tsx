import { memo } from "react";
import { ButtonBar } from "onyxia-ui/ButtonBar";
import { id } from "tsafe/id";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { Icon } from "onyxia-ui/Icon";

const buttonIds = ["back", "monitoring"] as const;

export type ButtonId = (typeof buttonIds)[number];

export type Props = {
    className?: string;
    onClick: (buttonId: ButtonId) => void;
    isMonitoringDisabled: boolean;
};

export const MyServiceButtonBar = memo((props: Props) => {
    const { className, onClick, isMonitoringDisabled } = props;

    return (
        <ButtonBar
            className={className}
            buttons={buttonIds.map(buttonId => ({
                buttonId,
                "icon": (() => {
                    switch (buttonId) {
                        case "back":
                            return id<MuiIconComponentName>("ArrowBack");
                        case "monitoring":
                            return id<MuiIconComponentName>("Equalizer");
                    }
                })(),
                "isDisabled": (() => {
                    switch (buttonId) {
                        case "monitoring":
                            return isMonitoringDisabled;
                        default:
                            return false;
                    }
                })(),
                "label": (() => {
                    switch (buttonId) {
                        case "back":
                            return "Back";
                        case "monitoring":
                            return (
                                <span>
                                    Monitoring&nbsp;
                                    <Icon
                                        size="extra small"
                                        icon={id<MuiIconComponentName>("OpenInNew")}
                                    />{" "}
                                </span>
                            );
                    }
                })()
            }))}
            onClick={onClick}
        />
    );
});
