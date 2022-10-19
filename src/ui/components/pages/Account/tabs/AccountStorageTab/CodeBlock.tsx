import { memo } from "react";
import { CopyBlock, atomOneLight, atomOneDark } from "react-code-blocks";

export type Props = {
    initScript: {
        fileBasename: string;
        scriptCode: string;
        programingLanguage: string;
    };
    isDarkModeEnabled: boolean;
};

const CodeBlock = memo((props: Props) => {
    const { initScript, isDarkModeEnabled } = props;

    return (
        <CopyBlock
            text={initScript.scriptCode}
            language={initScript.programingLanguage}
            showLineNumbers={true}
            theme={isDarkModeEnabled ? atomOneDark : atomOneLight}
            codeBlock
        />
    );
});

export default CodeBlock;
