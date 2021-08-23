import { memo, useMemo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { ButtonBar } from "app/components/shared/ButtonBar/ButtonBar";
import type { ButtonBarProps } from "app/components/shared/ButtonBar/ButtonBar";

const buttonIds = ["refresh", "launch", "password", "trash"] as const;

export type ButtonId = typeof buttonIds[number];

export type Props = {
    className?: string;
    onClick(buttonId: ButtonId): void;
};

export const MyServicesButtonBar = memo((props: Props) => {
    const { className, onClick } = props;

    const { t } = useTranslation("MyServicesButtonBar");

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
                        case "password":
                            return "key" as const;
                        case "trash":
                            return "delete" as const;
                    }
                })(),
                "isDisabled": false,
                "label": t(buttonId),
            })),
        [t],
    );

    return <ButtonBar className={className} buttons={buttons} onClick={onClick} />;
});

export declare namespace MyServicesButtonBar {
    export type I18nScheme = Record<ButtonId, undefined>;
}
