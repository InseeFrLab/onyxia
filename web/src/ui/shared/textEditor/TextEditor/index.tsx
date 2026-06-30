import { Suspense, lazy, type ReactNode } from "react";
import type { Extension } from "@uiw/react-codemirror";
import { assert, type Equals } from "tsafe/assert";

const TextEditorImpl = lazy(() => import("./TextEditor"));

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

    return (
        <Suspense fallback={fallback}>
            <TextEditorImpl {...rest} />
        </Suspense>
    );
}
