import { useCoreState, useCore } from "core";
import { useEffect, useReducer } from "react";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { tss } from "tss";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CircularUsage } from "./CircularUsage";
import { CollapsibleSectionHeader } from "onyxia-ui/CollapsibleSectionHeader";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";

type Props = {
    className?: string;
    evtActionUpdate: NonPostableEvt<void>;
};

export function Quotas(props: Props) {
    const { className, evtActionUpdate } = props;

    const { isReady, quotas, nonNegligibleQuotas } = useCoreState("quotas", "main");

    const { cx, classes } = useStyles();

    const { quotas: quotas_f } = useCore().functions;

    const [isCollapsed, toggleIsCollapsed] = useReducer(
        isCollapsed => !isCollapsed,
        true
    );

    useEffect(() => {
        const { setInactive } = quotas_f.setActive();

        return () => {
            setInactive();
        };
    }, []);

    useEvt(
        ctx => {
            evtActionUpdate.attach(ctx, () => quotas_f.update());
        },
        [evtActionUpdate]
    );

    return (
        <div className={cx(className, classes.root)}>
            {(() => {
                if (!isReady) {
                    return (
                        <div className={classes.loading}>
                            <CircularProgress />
                        </div>
                    );
                }

                return (
                    <>
                        <CollapsibleSectionHeader
                            className={classes.header}
                            isCollapsed={isCollapsed}
                            title={"Resource usage quotas"}
                            showAllStr={"Show all"}
                            total={quotas.length}
                            onToggleIsCollapsed={toggleIsCollapsed}
                        />
                        {(() => {
                            if (isCollapsed && nonNegligibleQuotas.length === 0) {
                                return (
                                    <Text typo="body 1">
                                        <Icon
                                            className={classes.checkIcon}
                                            icon={
                                                "CheckCircle" satisfies MuiIconComponentName
                                            }
                                        />
                                        &nbsp; Your current resource usage is low.
                                    </Text>
                                );
                            }

                            return (
                                <div className={classes.circularUsagesWrapper}>
                                    {(isCollapsed ? nonNegligibleQuotas : quotas).map(
                                        ({ name, used, total, usagePercentage }, i) => (
                                            <CircularUsage
                                                className={classes.circularUsage}
                                                key={i}
                                                name={name}
                                                used={used}
                                                total={total}
                                                usagePercentage={usagePercentage}
                                            />
                                        )
                                    )}
                                </div>
                            );
                        })()}
                    </>
                );
            })()}
        </div>
    );
}

const useStyles = tss.withName({ Quotas }).create(({ theme }) => ({
    "root": {},
    "header": {
        ...theme.spacing.topBottom("margin", 2)
    },
    "checkIcon": {
        "color": theme.colors.useCases.alertSeverity.success.main
    },
    "loading": {
        "display": "flex",
        "justifyContent": "center",
        "alignItems": "center",
        "height": theme.typography.rootFontSizePx * 10
    },
    "circularUsagesWrapper": {
        "display": "flex",
        "flexWrap": "wrap",
        "justifyContent": "space-between",
        "gap": theme.spacing(3)
    },
    "circularUsage": {
        "flexBasis": `calc(50% - ${theme.spacing(3) / 2}px)`
    }
}));
