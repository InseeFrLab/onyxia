
import React, { useMemo } from "react";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import memoize from "memoizee";
import { id } from "evt/tools/typeSafety/id";
import Box from "@material-ui/core/Box";

export type Action = "rename" | "create file" | "create directory" | "delete" | "copy path"

export type Props = {
    /** [HIGHER ORDER] */
    wordForFile: "file" | "secret";

    isThereAnItemSelected: boolean;
    isSelectedItemInEditingState: boolean;

    callback(params: { action: Action; }): void;

};

export function ExplorerButtonBar(props: Props) {

    const { 
        wordForFile, 
        callback, 
        isThereAnItemSelected, 
        isSelectedItemInEditingState 
    } = props;

    const { t } = useTranslation("ExplorerButtonBar");

    const onClickFactory = useMemo(
        () => memoize(
            (action: Action) =>
                () => callback({ action })
        ),
        [callback]
    );

    return (
        <Box>
            { ([
                "rename",
                "create file",
                "create directory",
                "delete",
                "copy path"
            ] as const).map(action =>
                <Button
                    icon={(() => {
                        switch (action) {
                            case "copy path": return "info" as const;
                            case "create directory": return "info";
                            case "create file": return "info";
                            case "delete": return "info";
                            case "rename": return "info";
                        }
                    })()}
                    disabled={
                        !isThereAnItemSelected && id<Action[]>(["copy path", "delete", "rename"]).includes(action) ||
                        isSelectedItemInEditingState && action === "rename"
                    }
                    key={action}
                    onClick={onClickFactory(action)}

                >
                    {
                        action === "create file" ?
                            t("create what", { "what": t(wordForFile) }) :
                            t(action)
                    }
                </Button>
            )}
        </Box>
    );

}
export declare namespace ExplorerButtonBar {
    export type I18nScheme = Record<Exclude<Action, "create file">, undefined> & {
        "create what": { what: string; };
        secret: undefined;
        file: undefined;
    };
}