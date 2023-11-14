import { memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys } from "i18nifty";
import { useConst } from "powerhooks/useConst";
import memoize from "memoizee";
import { Evt } from "evt";
import { NoRunningService } from "./NoRunningService";

export type Props = {
    className?: string;
    isUpdating: boolean;
    cards:
        | {
              helmReleaseName: string;
              chartIconUrl: string | undefined;
              chartName: string;
              friendlyName: string;
              openUrl: string | undefined;
              monitoringUrl: string | undefined;
              startTime: number | undefined;
              isShared: boolean;
              isOwned: boolean;
              /** undefined when isOwned === true*/
              ownerUsername: string | undefined;
              vaultTokenExpirationTime: number | undefined;
              s3TokenExpirationTime: number | undefined;
              hasPostInstallInstructions: boolean;
          }[]
        | undefined;
    catalogExplorerLink: Link;
    onRequestDelete(params: { helmReleaseName: string }): void;
    getEnv: (params: { helmReleaseName: string }) => Record<string, string>;
    getPostInstallInstructions: (params: { helmReleaseName: string }) => string;
    evtAction: NonPostableEvt<{
        action: "TRIGGER SHOW POST INSTALL INSTRUCTIONS";
        helmReleaseName: string;
    }>;
    getProjectServicePassword: () => Promise<string>;
};

export const MyServicesCards = memo((props: Props) => {
    const {
        className,
        cards,
        catalogExplorerLink,
        isUpdating,
        onRequestDelete,
        getEnv,
        getProjectServicePassword,
        getPostInstallInstructions,
        evtAction
    } = props;

    const { classes, cx } = useStyles({
        "isThereServicesRunning": (cards ?? []).length !== 0
    });

    const { t } = useTranslation({ MyServicesCards });

    const getEvtMyServicesCardAction = useConst(() =>
        memoize((_helmReleaseName: string) =>
            Evt.create<"SHOW POST INSTALL INSTRUCTIONS">()
        )
    );

    useEvt(
        ctx => {
            evtAction.$attach(
                action =>
                    action.action !== "TRIGGER SHOW POST INSTALL INSTRUCTIONS"
                        ? null
                        : [action.helmReleaseName],
                ctx,
                helmReleaseName =>
                    getEvtMyServicesCardAction(helmReleaseName).post(
                        "SHOW POST INSTALL INSTRUCTIONS"
                    )
            );
        },
        [evtAction]
    );

    const getMyServicesFunctionProps = useConst(() =>
        memoize((helmReleaseName: string) => ({
            "getPoseInstallInstructions": () =>
                getPostInstallInstructions({ helmReleaseName }),
            "onRequestDelete": () => onRequestDelete({ helmReleaseName }),
            "getEnv": () => getEnv({ helmReleaseName })
        }))
    );

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="section heading" className={classes.header}>
                {t("running services")}
                &nbsp; &nbsp;
                {isUpdating && <CircularProgress color="textPrimary" size={20} />}
            </Text>
            <div className={classes.wrapper}>
                {(() => {
                    if (cards === undefined) {
                        return null;
                    }

                    if (cards.length === 0) {
                        return (
                            <NoRunningService
                                className={classes.noRunningServices}
                                catalogExplorerLink={catalogExplorerLink}
                            />
                        );
                    }

                    return cards.map(card => {
                        const { getEnv, getPoseInstallInstructions, onRequestDelete } =
                            getMyServicesFunctionProps(card.helmReleaseName);

                        return (
                            <MyServicesCard
                                key={card.helmReleaseName}
                                evtAction={getEvtMyServicesCardAction(
                                    card.helmReleaseName
                                )}
                                getPoseInstallInstructions={
                                    !card.hasPostInstallInstructions
                                        ? undefined
                                        : getPoseInstallInstructions
                                }
                                getProjectServicePassword={getProjectServicePassword}
                                onRequestDelete={onRequestDelete}
                                getEnv={getEnv}
                                {...card}
                            />
                        );
                    });
                })()}
            </div>
        </div>
    );
});

export const { i18n } = declareComponentKeys<"running services">()({ MyServicesCards });

const useStyles = tss
    .withParams<{ isThereServicesRunning: boolean }>()
    .withName({ MyServicesCards })
    .create(({ theme, isThereServicesRunning }) => ({
        "root": {
            "overflow": "hidden",
            "display": "flex",
            "flexDirection": "column"
        },
        "header": {
            ...theme.spacing.topBottom("margin", 3)
        },
        "wrapper": {
            "overflow": "auto",
            ...(!isThereServicesRunning
                ? {
                      "flex": 1
                  }
                : {
                      "paddingRight": theme.spacing(3),
                      "display": "grid",
                      "gridTemplateColumns": "repeat(2,1fr)",
                      "gap": theme.spacing(4)
                  }),
            "paddingBottom": theme.spacing(4)
        },
        "noRunningServices": {
            "height": "100%"
        }
    }));
