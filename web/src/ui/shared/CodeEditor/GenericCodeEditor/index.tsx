import { lazy } from "react";
import type { GLOBAL_NAME as OF_TYPE_SCREEN_SCALER_GLOBAL_NAME } from "screen-scaler";

const SCREEN_SCALER_GLOBAL_NAME: typeof OF_TYPE_SCREEN_SCALER_GLOBAL_NAME =
    "__screenScaler";

const GenericCodeEditorWithoutScreenScaler = lazy(() => import("./GenericCodeEditor"));
const GenericCodeEditorWithScreenScaler = lazy(
    () => import("./GenericCodeEditorWithScreenScaler")
);

export namespace GenericCodeEditor {
    export type Props = import("./GenericCodeEditor").Props;
}

export function GenericCodeEditor(props: GenericCodeEditor.Props) {
    const isScreenScalerAvailable = SCREEN_SCALER_GLOBAL_NAME in window;

    return isScreenScalerAvailable ? (
        <GenericCodeEditorWithScreenScaler {...props} />
    ) : (
        <GenericCodeEditorWithoutScreenScaler {...props} />
    );
}
