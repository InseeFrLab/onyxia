import { useCoreState, useCore } from "core";
import { useEffect } from "react";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { tss } from "tss";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CircularUsage } from "./CircularUsage";

type Props = {
    className?: string;
    evtActionUpdate: NonPostableEvt<void>;
};

export function Quotas(props: Props) {
    const { className, evtActionUpdate } = props;

    const { isReady, quotas } = useCoreState("quotas", "main");

    const { cx, classes } = useStyles();

    const { quotas: quotas_f } = useCore().functions;

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

                return quotas.map(({ name, used, total, usagePercentage }, i) => (
                    <CircularUsage
                        key={i}
                        name={name}
                        used={used}
                        total={total}
                        usagePercentage={usagePercentage}
                    />
                ));
            })()}
        </div>
    );
}

const useStyles = tss.withName({ Quotas }).create(({ theme }) => ({
    "root": {},
    "loading": {
        "display": "flex",
        "justifyContent": "center",
        "alignItems": "center",
        "height": theme.typography.rootFontSizePx * 30
    }
}));
