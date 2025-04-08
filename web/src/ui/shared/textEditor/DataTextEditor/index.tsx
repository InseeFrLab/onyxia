import { lazy, Suspense } from "react";
import { assert, type Equals } from "tsafe/assert";
import type { Stringifyable } from "core/tools/Stringifyable";

export type Props = {
    className?: string;
    id?: string;
    maxHeight?: number;
    fallback?: JSX.Element;
    value: Stringifyable;
    onChange: (newValue: Stringifyable) => void;
    onErrorMsgChanged?: (errorMsg: string | undefined) => void;
    jsonSchema: Record<string, Stringifyable> | undefined;
    additionalValidation?: (
        value: Stringifyable
    ) => { isValid: true } | { isValid: false; errorMsg: string };
    allDefaults?: {
        isChecked: boolean;
        onIsCheckedChange: (isChecked: boolean) => void;
    };
};

{
    type Props_Expected = import("./DataTextEditor").Props;

    assert<Equals<Props, Props_Expected>>();
}

const DataTextEditorLazy = lazy(() => import("./DataTextEditor"));

export function DataTextEditor(props: Props) {
    return (
        <Suspense fallback={props.fallback}>
            <DataTextEditorLazy {...props} />
        </Suspense>
    );
}
