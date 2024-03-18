import { useCoreState } from "core";
import { assert } from "tsafe/assert";
import { CodeBlock, atomOneLight, atomOneDark } from "react-code-blocks";
import { tss } from "tss";

type Props = {
    className?: string;
};

export function EnvTab(props: Props) {
    const { className } = props;

    const { isReady, env } = useCoreState("serviceDetails", "main");
    const isDarkModeEnabled = useCoreState("userConfigs", "isDarkModeEnabled");
    const { classes, cx } = useStyles();

    assert(isReady);

    return (
        <div className={cx(classes.root, className)}>
            <CodeBlock
                language="json"
                showLineNumbers={true}
                theme={isDarkModeEnabled ? atomOneDark : atomOneLight}
                text={JSON.stringify(env, null, 2)}
            />
        </div>
    );
}

const useStyles = tss.withName({ EnvTab }).create(() => ({
    "root": {}
}));
