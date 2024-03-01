import type { PageRoute } from "./route";
import { tss } from "tss";
import { useCore, useCoreState } from "core";
import { useEffect } from "react";
import { Button } from "onyxia-ui/Button";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyServices2(props: Props) {
    const { className, route } = props;

    const { cx, classes } = useStyles();

    const { serviceManagement } = useCore().functions;

    const runningServices = useCoreState("serviceManagement", "runningServices");

    const { t } = useTranslation({ MyServices2 });

    useEffect(() => {
        const { setInactive } = serviceManagement.setActive();

        return () => {
            setInactive();
        };
    }, []);

    if (runningServices === undefined) {
        return <div>Loading...</div>;
    }

    return (
        <div className={cx(classes.root, className)}>
            <h1>
                {t("greetings", {
                    "foo": route.params.foo ?? ""
                })}
            </h1>
            {runningServices.map(service => (
                <div key={service.helmReleaseName}>
                    {service.helmReleaseName}
                    <Button
                        className={classes.stopButton}
                        variant="primary"
                        onClick={() =>
                            serviceManagement.stopService({
                                "helmReleaseName": service.helmReleaseName
                            })
                        }
                    >
                        {t("stop")}
                    </Button>
                </div>
            ))}
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    | {
          K: "greetings";
          P: {
              foo: string;
          };
      }
    | "stop"
>()({ MyServices2 });

const useStyles = tss.withName({ MyServices2 }).create(({ theme }) => ({
    "root": {
        "color": theme.colors.useCases.typography.textFocus
    },
    "stopButton": {
        "marginLeft": theme.spacing(4)
    }
}));
