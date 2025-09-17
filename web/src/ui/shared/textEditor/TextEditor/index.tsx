import { Suspense, lazy, type ReactNode } from "react";
import { evtIsScreenScalerOutOfBound } from "screen-scaler";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";
import type { Extension } from "@uiw/react-codemirror";
import { assert, type Equals } from "tsafe/assert";

const TextEditorWithoutScreenScaler = lazy(() => import("./TextEditor"));
const TextEditorWithScreenScaler = lazy(() => import("./TextEditorWithScreenScaler"));

export type Props = {
    className?: string;
    id?: string;
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

    useRerenderOnStateChange(evtIsScreenScalerOutOfBound);

    const isScreenScalerEnabled = evtIsScreenScalerOutOfBound.state !== undefined;

    return (
        <Suspense>
            {isScreenScalerEnabled ? (
                <TextEditorWithScreenScaler {...rest} />
            ) : (
                <TextEditorWithoutScreenScaler {...rest} />
            )}
        </Suspense>
    );
}
