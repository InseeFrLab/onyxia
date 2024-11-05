import { tss } from "tss";
import type { RootForm } from "core/usecases/launcher/decoupledLogic/formTypes";
import type { FormCallbacks } from "./FormCallbacks";
import { ConfigurationTopLevelGroup } from "./ConfigurationTopLevelGroup";
import { DependencyTabs } from "./DependenciesTabs";

type Props = {
    className?: string;
    rootForm: RootForm;
    callbacks: FormCallbacks;
};

export function RootFormComponent(props: Props) {
    const { className, rootForm, callbacks } = props;

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <ConfigurationTopLevelGroup
                className={classes.mainCard}
                main={rootForm.main}
                global={rootForm.global}
                callbacks={callbacks}
            />
            <DependencyTabs
                className={classes.dependencyTabs}
                dependencies={rootForm.dependencies}
                disabledDependencies={rootForm.disabledDependencies}
                callbacks={callbacks}
            />
        </div>
    );
}

const useStyles = tss.withName({ RootFormComponent }).create(({ theme }) => ({
    "root": {},
    "mainCard": {},
    "dependencyTabs": {
        "marginTop": theme.spacing(4)
    }
}));
