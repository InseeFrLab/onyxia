import type { ReactNode } from "react";
import { hive } from "@codemirror/legacy-modes/mode/sql";
import { StreamLanguage } from "@codemirror/language";
import { assert, type Equals } from "tsafe/assert";
import { TextEditor } from "../../TextEditor";

export type Props = {
    className?: string;
    id?: string;
    maxHeight?: number;
    value: string;
    onChange: ((newValue: string) => void) | undefined;
    fallback?: JSX.Element;
    children?: ReactNode;
};

{
    type Props_Expected = Omit<import("../../TextEditor").Props, "extensions">;

    assert<Equals<Props, Props_Expected>>;
}

export default function HiveCodeTextEditor(props: Props) {
    return <TextEditor {...props} extensions={[StreamLanguage.define(hive)]} />;
}
