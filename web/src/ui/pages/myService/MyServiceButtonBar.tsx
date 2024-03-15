import { memo } from "react";
import { ButtonBar } from "onyxia-ui/ButtonBar";
import { id } from "tsafe/id";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";

const buttonIds = ["back", "open", "delete", "monitoring"] as const;

export type ButtonId = (typeof buttonIds)[number];

export type Props = {
    className?: string;
    onClick: (buttonId: ButtonId) => void;
};

export const MyServiceButtonBar = memo((props: Props) => {
    const { className, onClick } = props;

    return (
        <ButtonBar
            className={className}
            buttons={buttonIds.map(buttonId => ({
                buttonId,
                "icon": (() => {
                    switch (buttonId) {
                        case "back":
                            return id<MuiIconComponentName>("ArrowBack");
                        case "open":
                            return id<MuiIconComponentName>("OpenInNew");
                        case "delete":
                            return id<MuiIconComponentName>("Delete");
                        case "monitoring":
                            return id<MuiIconComponentName>("Equalizer");
                    }
                })(),
                "isDisabled": false,
                "label": (() => {
                    switch (buttonId) {
                        case "back":
                            return "Back";
                        case "open":
                            return "Open";
                        case "delete":
                            return "Delete";
                        case "monitoring":
                            return "Monitoring";
                    }
                })()
            }))}
            onClick={onClick}
        />
    );
});
