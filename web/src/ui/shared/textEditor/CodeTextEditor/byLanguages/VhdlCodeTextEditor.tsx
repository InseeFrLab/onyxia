import type { ReactNode } from "react";
import { vhdl } from "@codemirror/legacy-modes/mode/vhdl";
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

export default function VhdlCodeTextEditor(props: Props) {
    return <TextEditor {...props} extensions={[StreamLanguage.define(vhdl)]} />;
}
