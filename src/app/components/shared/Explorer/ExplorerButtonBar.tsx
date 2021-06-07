
import { useMemo, memo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { useConstCallback } from "powerhooks";
import { ButtonBar } from "app/components/shared/ButtonBar";
import type { ButtonBarProps } from "app/components/shared/ButtonBar";

const buttonIds = ["refresh", "rename", "create file", "create directory", "delete", "copy path"] as const;

export type ButtonId = typeof buttonIds[number];

export type Props = {
    /** [HIGHER ORDER] */
    wordForFile: "file" | "secret";


    selectedItemKind: "file" | "directory" | "none";
    isSelectedItemInEditingState: boolean;
    isViewingFile: boolean;

    callback(buttonId: ButtonId): void;

};

export const ExplorerButtonBar = memo((props: Props) => {

    const {
        wordForFile,
        callback,
        selectedItemKind,
        isSelectedItemInEditingState,
        isViewingFile
    } = props;

    const { t } = useTranslation("ExplorerButtonBar");

    const onClick = useConstCallback<ButtonBarProps<ButtonId>["onClick"]>(
        buttonId => callback(buttonId)
    );

    const buttons = useMemo(
        (): ButtonBarProps<ButtonId>["buttons"] =>
            buttonIds.map(buttonId => ({
                "buttonId": buttonId,
                "icon": (() => {
                    switch (buttonId) {
                        case "refresh": return "cached" as const;
                        case "copy path": return "filterNone";
                        case "create directory": return "add";
                        case "create file": return "add";
                        case "delete": return "delete";
                        case "rename": return "edit";
                    }
                })(),
                "isDisabled": (() => {
                    switch (buttonId) {
                        case "refresh": return false;
                        case "rename": return (
                            isSelectedItemInEditingState ||
                            selectedItemKind === "none" ||
                            isViewingFile
                        );
                        case "create file":
                        case "create directory": return isViewingFile;
                        case "delete": return selectedItemKind === "none" || isViewingFile;
                        case "copy path": return selectedItemKind !== "file" && !isViewingFile;
                    }
                })(),
                "label":
                    buttonId === "create file" ?
                        t("create what", { "what": t(wordForFile) }) :
                        t(buttonId)
            })),
        [
            isSelectedItemInEditingState,
            selectedItemKind,
            isViewingFile,
            wordForFile,
            t
        ]
    );

    return (
        <ButtonBar
            buttons={buttons}
            onClick={onClick}
        />
    );

});
export declare namespace ExplorerButtonBar {
    export type I18nScheme = Record<Exclude<ButtonId, "create file">, undefined> & {
        "create what": { what: string; };
        secret: undefined;
        file: undefined;
    };
}
