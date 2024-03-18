import { useCoreState } from "core";
import { assert } from "tsafe/assert";
import { CodeBlock, atomOneLight, atomOneDark } from "react-code-blocks";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";

type Props = {
    className?: string;
};

export function TasksTab(props: Props) {
    const { className } = props;

    const { isReady, tasks } = useCoreState("serviceDetails", "main");
    const isDarkModeEnabled = useCoreState("userConfigs", "isDarkModeEnabled");
    const { classes, cx } = useStyles();

    assert(isReady);

    return (
        <div className={cx(classes.root, className)}>
            {tasks.map(({ taskId, logs }) => (
                <div key={taskId} className={classes.taskWrapper}>
                    <div className={classes.labelWrapper}>
                        <Text typo="label 1">Task ID:</Text>
                        &nbsp; &nbsp;
                        <Text typo="body 1">{taskId}</Text>
                    </div>
                    <CodeBlock
                        language="bash"
                        showLineNumbers={true}
                        theme={isDarkModeEnabled ? atomOneDark : atomOneLight}
                        text={logs}
                    />
                </div>
            ))}
        </div>
    );
}

const useStyles = tss.withName({ TasksTab }).create(({ theme }) => ({
    "root": {
        "overflowY": "auto"
    },
    "taskWrapper": {
        "marginTop": theme.spacing(2)
    },
    "labelWrapper": {
        "display": "flex",
        "marginBottom": theme.spacing(3)
    }
}));
