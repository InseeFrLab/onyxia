import { shell } from "@codemirror/legacy-modes/mode/shell";
import { StreamLanguage } from "@codemirror/language";
import { GenericCodeEditor } from "./GenericCodeEditor";

export type Props = Omit<GenericCodeEditor.Props, "extensions">;

export default function YamlCodeEditor(props: Props) {
    return <GenericCodeEditor {...props} extensions={[StreamLanguage.define(shell)]} />;
}
