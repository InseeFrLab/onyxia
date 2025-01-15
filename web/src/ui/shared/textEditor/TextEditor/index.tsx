import { Suspense, lazy, type ReactNode } from "react";
import type { GLOBAL_NAME as OF_TYPE_SCREEN_SCALER_GLOBAL_NAME } from "screen-scaler";
import type { Extension } from "@uiw/react-codemirror";
import { assert, type Equals } from "tsafe/assert";

const SCREEN_SCALER_GLOBAL_NAME: typeof OF_TYPE_SCREEN_SCALER_GLOBAL_NAME =
    "__screenScaler";

const TextEditorWithoutScreenScaler = lazy(() => import("./TextEditor"));
const TextEditorWithScreenScaler = lazy(() => import("./TextEditorWithScreenScaler"));

export type Props = {
    className?: string;
    id: string;
    maxHeight?: number;
    extensions: Extension[];
    value: string;
    onChange: ((newValue: string) => void) | undefined;
    fallback?: JSX.Element;
    children?: ReactNode;
};

{
    type Props_Expected = import("./TextEditor").Props & Pick<Props, "fallback">;

    assert<Equals<Props, Props_Expected>>();
}

export function TextEditor(props: Props) {
    const { fallback, ...rest } = props;

    const isScreenScalerAvailable = SCREEN_SCALER_GLOBAL_NAME in window;

    return (
        <Suspense>
            {isScreenScalerAvailable ? (
                <TextEditorWithScreenScaler {...rest} />
            ) : (
                <TextEditorWithoutScreenScaler {...rest} />
            )}
        </Suspense>
    );
}
