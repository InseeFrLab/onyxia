import { memo } from "react";
import { CopyBlock, atomOneLight, atomOneDark } from "react-code-blocks";

export type Props = {
    initScript: {
        scriptCode: string;
        programmingLanguage: string;
    };
    isDarkModeEnabled: boolean;
};

const CodeBlock = memo((props: Props) => {
    const { initScript, isDarkModeEnabled } = props;

    return (
        <CopyBlock
            text={initScript.scriptCode}
            language={initScript.programmingLanguage}
            showLineNumbers={true}
            theme={isDarkModeEnabled ? atomOneDark : atomOneLight}
            codeBlock
        />
    );
});

export default CodeBlock;
