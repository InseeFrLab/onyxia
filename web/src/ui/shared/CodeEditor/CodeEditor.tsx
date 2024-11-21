import type { GenericCodeEditor } from "./GenericCodeEditor";
import { Suspense, lazy, type JSX } from "react";

const YamlCodeEditor = lazy(() => import("./YamlCodeEditor"));
const ShellCodeEditor = lazy(() => import("./ShellCodeEditor"));

export namespace CodeEditor {
    export type Props = Omit<GenericCodeEditor.Props, "extensions"> & {
        language: "shell" | "yaml";
        fallback?: JSX.Element;
    };
}

export function CodeEditor(props: CodeEditor.Props) {
    const { language, fallback, ...rest } = props;

    return (
        <Suspense fallback={fallback}>
            {(() => {
                switch (language) {
                    case "shell":
                        return <ShellCodeEditor {...rest} />;
                    case "yaml":
                        return <YamlCodeEditor {...rest} />;
                }
            })()}
        </Suspense>
    );
}
