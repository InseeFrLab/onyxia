import { Tabs } from "onyxia-ui/Tabs";
import type { FormFieldGroup } from "core/usecases/launcher/decoupledLogic/formTypes";
import { tss } from "tss";
import { useMemo, useState } from "react";
import { Text } from "onyxia-ui/Text";
import { ConfigurationTopLevelGroup } from "./ConfigurationTopLevelGroup";
import type { FormCallbacks } from "./FormCallbacks";

type Props = {
    className?: string;
    dependencies: Record<
        string,
        {
            main: FormFieldGroup["nodes"];
            global: FormFieldGroup["nodes"];
        }
    >;
    disabledDependencies: string[];
    callbacks: FormCallbacks;
};

export function DependencyTabs(props: Props) {
    const { className, dependencies, disabledDependencies, callbacks } = props;

    const { cx, classes } = useStyles();

    const tabs = useMemo(
        () => Object.keys(dependencies).map(tabId => ({ "id": tabId, "title": tabId })),
        [dependencies]
    );

    const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

    return (
        <Tabs
            activeTabId={cx(classes.root, className)}
            maxTabCount={7}
            onRequestChangeActiveTab={setActiveTabId}
            tabs={tabs}
            size="small"
        >
            {(() => {
                if (disabledDependencies.includes(activeTabId)) {
                    return (
                        <Text typo="label 1">
                            This dependency is currently disabled, enable it to configure
                            it. No {activeTabId} will be launched.
                        </Text>
                    );
                }

                const { main, global } = dependencies[activeTabId];

                return (
                    <ConfigurationTopLevelGroup
                        main={main}
                        global={global}
                        callbacks={callbacks}
                    />
                );
            })()}
        </Tabs>
    );
}

const useStyles = tss.withName({ DependencyTabs }).create(() => ({
    "root": {}
}));
