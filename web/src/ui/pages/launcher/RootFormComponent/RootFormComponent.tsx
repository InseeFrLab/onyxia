import { tss } from "tss";
import { Fragment } from "react";
import type { RootForm } from "core/usecases/launcher/decoupledLogic/formTypes";
import type { FormCallbacks } from "./FormCallbacks";
import { ConfigurationTopLevelGroup } from "./ConfigurationTopLevelGroup";
import { Text } from "onyxia-ui/Text";
import { objectEntries } from "tsafe/objectEntries";
import { capitalize } from "tsafe/capitalize";

type Props = {
    className?: string;
    rootForm: RootForm;
    callbacks: FormCallbacks;
};

export function RootFormComponent(props: Props) {
    const { className, rootForm, callbacks } = props;

    const { classes, cx } = useStyles();

    return (
        <form className={cx(classes.root, className)} autoComplete="off">
            <ConfigurationTopLevelGroup
                main={rootForm.main}
                global={rootForm.global}
                callbacks={callbacks}
            />
            {objectEntries(rootForm.dependencies).map(([dependencyName, dependency]) => (
                <Fragment key={dependencyName}>
                    <Text className={classes.dependencyTitle} typo="navigation label">
                        {capitalize(dependencyName)}
                    </Text>
                    <ConfigurationTopLevelGroup
                        main={dependency.main}
                        global={dependency.global}
                        callbacks={callbacks}
                    />
                </Fragment>
            ))}
        </form>
    );
}

const useStyles = tss.withName({ RootFormComponent }).create(({ theme }) => ({
    root: {},
    dependencyTitle: {
        marginBottom: theme.spacing(3)
    }
}));
