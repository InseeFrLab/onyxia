import { useCoreState } from "core";
import { assert } from "tsafe/assert";
import { CodeBlock, atomOneLight, atomOneDark } from "react-code-blocks";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";

type Props = {
    className?: string;
};

export function LogsTab(props: Props) {
    const { className } = props;

    const { isReady, tasks } = useCoreState("serviceDetails", "main");
    const isDarkModeEnabled = useCoreState("userConfigs", "isDarkModeEnabled");
    const { classes, cx } = useStyles();

    assert(isReady);

    return (
        <div className={cx(classes.root, className)}>
            {(() => {
                if (tasks.length === 0) {
                    return (
                        <div className={classes.noTasksWrapper}>
                            <Text typo="label 1">No tasks</Text>
                        </div>
                    );
                }

                return tasks.map(({ taskId, logs }) => (
                    <div key={taskId} className={classes.taskWrapper}>
                        <div className={classes.labelWrapper}>
                            <Text typo="label 1">Pod:</Text>
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
                ));
            })()}
        </div>
    );
}

const useStyles = tss.withName({ LogsTab }).create(({ theme }) => ({
    "root": {},
    "taskWrapper": {
        "marginTop": theme.spacing(2)
    },
    "noTasksWrapper": {
        "marginTop": theme.spacing(2),
        "textAlign": "center"
    },
    "labelWrapper": {
        "display": "flex",
        "marginBottom": theme.spacing(3)
    }
}));
