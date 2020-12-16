
import React, { useMemo } from "react";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import memoize from "memoizee";
import { id } from "evt/tools/typeSafety/id";

export type Action = "rename" | "create secret" | "create directory" | "delete" | "copy path"

export type Props = {

    isThereAnItemSelected: boolean;
    callback(params: { action: Action; }): void;

};

export function ExplorerButtonBar(props: Props) {

    const { callback, isThereAnItemSelected } = props;

    const { t } = useTranslation("ExplorerButtonBar");

    const onClickFactory = useMemo(
        () => memoize(
            (action: Action) =>
                () => callback({ action })
        ),
        [callback]
    );

    return (
        <> { ([
            "rename",
            "create secret",
            "create directory",
            "delete",
            "copy path"
        ] as const).map(action =>
            <Button
                icon={(() => {
                    switch (action) {
                        case "copy path": return "info" as const;
                        case "create directory": return "info";
                        case "create secret": return "info";
                        case "delete": return "info";
                        case "rename": return "info";
                    }
                })()}
                disabled={!isThereAnItemSelected && id<Action[]>(["copy path", "delete", "rename"]).includes(action)}
                key={action}
                onClick={onClickFactory(action)}
            >
                {t(action)}
            </Button>
        )} </>
    );

}

export declare namespace ExplorerButtonBar {
    export type I18nScheme = Record<Action, undefined>;
}