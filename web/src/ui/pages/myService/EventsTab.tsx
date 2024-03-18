import { useCoreState } from "core";
import { assert } from "tsafe/assert";
import { CodeBlock, atomOneLight, atomOneDark } from "react-code-blocks";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";

type Props = {
    className?: string;
};

export function EventTabs(props: Props) {
    const { className } = props;

    const { isReady, events } = useCoreState("serviceDetails", "main");
    const isDarkModeEnabled = useCoreState("userConfigs", "isDarkModeEnabled");
    const { classes, cx } = useStyles();

    assert(isReady);

    return (
        <div className={cx(classes.root, className)}>
            {(() => {
                if (events.length === 0) {
                    return (
                        <div className={classes.noEventsWrapper}>
                            <Text typo="label 1">No Events</Text>
                        </div>
                    );
                }

                return (
                    <CodeBlock
                        language="bash"
                        showLineNumbers={true}
                        theme={isDarkModeEnabled ? atomOneDark : atomOneLight}
                        text={events.map(({ message }) => message).join("\n")}
                    />
                );
            })()}
        </div>
    );
}

const useStyles = tss.withName({ EventTabs }).create(({ theme }) => ({
    "root": {},
    "noEventsWrapper": {
        "marginTop": theme.spacing(2),
        "textAlign": "center"
    }
}));
