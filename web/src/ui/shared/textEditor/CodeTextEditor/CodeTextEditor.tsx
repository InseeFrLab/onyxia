import type { ReactNode } from "react";
import { assert, type Equals } from "tsafe/assert";
import { Suspense, lazy } from "react";
const ShellCodeTextEditor = lazy(() => import("./ShellCodeTextEditor"));
const JsonCodeTextEditor = lazy(() => import("./JsonCodeTextEditor"));
const LegacyModeCodeTextEditor = lazy(() => import("./LegacyModeCodeTextEditor"));

export type CodeTextEditorLanguage =
    | "shell"
    | "JSON"
    | "python"
    | "R"
    | "SQL"
    | "properties";

export type Props = {
    className?: string;
    id?: string;
    maxHeight?: number;
    value: string;
    onChange: ((newValue: string) => void) | undefined;
    fallback?: JSX.Element;
    children?: ReactNode;
    language: CodeTextEditorLanguage;
};

{
    type Props_Expected = Omit<import("../TextEditor").Props, "extensions"> &
        Pick<Props, "language">;

    assert<Equals<Props, Props_Expected>>;
}

export function CodeTextEditor(props: Props) {
    const { language, ...rest } = props;

    return (
        <Suspense fallback={rest.fallback}>
            {(() => {
                switch (language) {
                    case "shell":
                        return <ShellCodeTextEditor {...rest} />;
                    case "JSON":
                        return <JsonCodeTextEditor {...rest} />;
                    case "python":
                    case "R":
                    case "SQL":
                    case "properties":
                        return <LegacyModeCodeTextEditor {...rest} language={language} />;
                }
            })()}
        </Suspense>
    );
}
