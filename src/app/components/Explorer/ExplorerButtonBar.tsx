
import React, { useMemo } from "react";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import memoize from "memoizee";

export type Action = "rename" | "create secret" | "create directory" | "delete" | "copy path" 

export type Props = {

    isThereAnItemSelected: boolean;
    callback(params: { action: Action; }): void;

};

export function ExplorerButtonBar(props: Props) {

    const { t } = useTranslation("ExplorerButtonBar");

    const onClickFactory= useMemo(
        () => memoize(
            (action: Action) =>
                () => { }
        ),
        []
    );

    return (
        <>
            <Button >{t("create secret")}</Button>
        </>
    );





}

export declare namespace ExplorerButtonBar {

    export type I18nScheme = Record<Action, undefined>;


}