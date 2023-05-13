import { useState, useMemo, useReducer, useRef, memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { makeStyles, Text } from "ui/theme";
import { smartTrim } from "ui/tools/smartTrim";
import { useTranslation } from "ui/i18n";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { ReactComponent as ServiceNotFoundSvg } from "ui/assets/svg/ServiceNotFound.svg";
import MuiLink from "@mui/material/Link";
import type { Link } from "type-route";
import { Dialog } from "onyxia-ui/Dialog";
import { assert } from "tsafe/assert";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Button } from "ui/theme";
import { Markdown } from "onyxia-ui/Markdown";
import { symToStr } from "tsafe/symToStr";
import { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { useDomRect } from "powerhooks/useDomRect";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
    isUpdating: boolean;
    cards:
        | {
              serviceId: string;
              packageIconUrl?: string;
              friendlyName: string;
              packageName: string;
              env: Record<string, string>;
              openUrl: string | undefined;
              monitoringUrl: string | undefined;
              startTime: number | undefined;
              postInstallInstructions: string | undefined;
              isShared: boolean;
              isOwned: boolean;
              /** undefined when isOwned === true*/
              ownerUsername: string | undefined;
              vaultTokenExpirationTime: number | undefined;
              s3TokenExpirationTime: number | undefined;
          }[]
        | undefined;
    catalogExplorerLink: Link;
    onRequestDelete(params: { serviceId: string }): void;
    evtAction: NonPostableEvt<{
        action: "TRIGGER SHOW POST INSTALL INSTRUCTIONS";
        serviceId: string;
    }>;
    getServicePassword: () => Promise<string>;
};

export const MyServicesCards = memo((props: Props) => {
    const {
        className,
        onRequestDelete,
        cards,
        catalogExplorerLink,
        evtAction,
        isUpdating,
        getServicePassword
    } = props;

    const { classes, cx } = useStyles({
        "isThereServicesRunning": (cards ?? []).length !== 0
    });

    const { t } = useTranslation({ MyServicesCards });

    const onRequestDeleteFactory = useCallbackFactory(([serviceId]: [string]) =>
        onRequestDelete({ serviceId })
    );

    const [dialogDesc, setDialogDesc] = useState<
        | { dialogShowingWhat: "env"; serviceId: string }
        | {
              dialogShowingWhat: "postInstallInstructions";
              serviceId: string;
              servicePassword: string;
          }
        | undefined
    >(undefined);

    const onDialogClose = useConstCallback(() => setDialogDesc(undefined));

    const onRequestShowEnvOrPostInstallInstructionFactory = useCallbackFactory(
        async ([showWhat, serviceId]: ["env" | "postInstallInstructions", string]) => {
            switch (showWhat) {
                case "env":
                    setDialogDesc({ "dialogShowingWhat": showWhat, serviceId });
                    break;
                case "postInstallInstructions":
                    setDialogDesc({
                        "dialogShowingWhat": showWhat,
                        serviceId,
                        "servicePassword": await getServicePassword()
                    });
                    break;
            }
        }
    );

    useEvt(
        ctx =>
            evtAction.pipe(ctx).$attach(
                event =>
                    event.action === "TRIGGER SHOW POST INSTALL INSTRUCTIONS"
                        ? [event]
                        : null,
                ({ serviceId }) =>
                    onRequestShowEnvOrPostInstallInstructionFactory(
                        "postInstallInstructions",
                        serviceId
                    )()
            ),
        [evtAction]
    );

    const { dialogBody, dialogButton: dialogButtons } = useMemo(() => {
        if (dialogDesc === undefined) {
            return {};
        }

        const { postInstallInstructions, env, openUrl, startTime } = (cards ?? []).find(
            card => card.serviceId === dialogDesc.serviceId
        )!;

        const dialogBody = (() => {
            switch (dialogDesc.dialogShowingWhat) {
                case "postInstallInstructions":
                    return postInstallInstructions ?? "Your service is ready";
                case "env":
                    console.log(JSON.stringify(env, null, 2));
                    return [
                        Object.entries(env)
                            .filter(([, value]) => value !== "")
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(
                                ([key, value]) =>
                                    `**${key}**: \`${smartTrim({
                                        "text": value,
                                        "minCharAtTheEnd": 4,
                                        "maxLength": 40
                                    })}\`  `
                            )
                            .join("\n"),
                        "  \n",
                        `**${t("need to copy")}**`,
                        t("everything have been printed to the console"),
                        "*Windows/Linux*: `Shift + CTRL + J`",
                        "*Mac*: `⌥ + ⌘ + J`"
                    ].join("  \n");
            }
        })();

        const dialogButton = (() => {
            switch (dialogDesc.dialogShowingWhat) {
                case "postInstallInstructions":
                    return (
                        <>
                            <Button variant="secondary" onClick={onDialogClose}>
                                {t("return")}
                            </Button>

                            {startTime === undefined ? (
                                <CircularProgress
                                    className={classes.circularProgress}
                                    color="textPrimary"
                                    size={20}
                                />
                            ) : (
                                openUrl && (
                                    <CopyOpenButton
                                        openUrl={openUrl}
                                        servicePassword={
                                            postInstallInstructions !== undefined &&
                                            postInstallInstructions.indexOf(
                                                dialogDesc.servicePassword
                                            ) >= 0
                                                ? dialogDesc.servicePassword
                                                : undefined
                                        }
                                        onDialogClose={onDialogClose}
                                    />
                                )
                            )}
                        </>
                    );
                case "env":
                    return (
                        <Button variant="secondary" onClick={onDialogClose}>
                            {t("ok")}
                        </Button>
                    );
            }
        })();

        return { dialogBody, dialogButton };
    }, [dialogDesc, t, cards]);

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

                    return cards.map(card => (
                        <MyServicesCard
                            key={card.serviceId}
                            {...card}
                            onRequestShowEnv={onRequestShowEnvOrPostInstallInstructionFactory(
                                "env",
                                card.serviceId
                            )}
                            onRequestDelete={
                                card.isOwned
                                    ? onRequestDeleteFactory(card.serviceId)
                                    : undefined
                            }
                            onRequestShowPostInstallInstructions={
                                card.postInstallInstructions !== undefined
                                    ? onRequestShowEnvOrPostInstallInstructionFactory(
                                          "postInstallInstructions",
                                          card.serviceId
                                      )
                                    : undefined
                            }
                        />
                    ));
                })()}
            </div>
            <Dialog
                body={
                    dialogBody && (
                        <div className={classes.dialogBody}>
                            <Markdown>{dialogBody}</Markdown>
                        </div>
                    )
                }
                isOpen={dialogDesc !== undefined}
                onClose={onDialogClose}
                buttons={dialogButtons ?? null}
            />
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "running services"
    | "no services running"
    | "launch one"
    | "ok"
    | "need to copy"
    | "everything have been printed to the console"
    | "first copy the password"
    | "open the service"
    | "return"
>()({ MyServicesCards });

const useStyles = makeStyles<{ isThereServicesRunning: boolean }>({
    "name": { MyServicesCards }
})((theme, { isThereServicesRunning }) => ({
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
    },
    "dialogBody": {
        "maxHeight": 450,
        "overflow": "auto"
    },
    "circularProgress": {
        ...theme.spacing.rightLeft("margin", 3)
    }
}));

const { NoRunningService } = (() => {
    type Props = {
        className: string;
        catalogExplorerLink: Link;
    };

    const NoRunningService = memo((props: Props) => {
        const { className, catalogExplorerLink } = props;

        const { classes, cx } = useStyles();

        const { t } = useTranslation({ MyServicesCards });

        return (
            <div className={cx(classes.root, className)}>
                <div className={classes.innerDiv}>
                    <ServiceNotFoundSvg className={classes.svg} />
                    <Text typo="page heading" className={classes.h2}>
                        {t("no services running")}
                    </Text>
                    <MuiLink
                        className={classes.link}
                        {...catalogExplorerLink}
                        underline="hover"
                    >
                        {t("launch one")}
                    </MuiLink>
                </div>
            </div>
        );
    });

    const useStyles = makeStyles({
        "name": `${symToStr({ MyServicesCards })}${symToStr({ NoRunningService })}`
    })(theme => ({
        "root": {
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center"
        },
        "innerDiv": {
            "textAlign": "center",
            "maxWidth": 500
        },
        "svg": {
            "fill": theme.colors.palette.dark.greyVariant2,
            "width": 100,
            "margin": 0
        },
        "h2": {
            ...theme.spacing.topBottom("margin", 5)
        },
        "link": {
            "cursor": "pointer"
        }
    }));

    return { NoRunningService };
})();

const { CopyOpenButton } = (() => {
    type Props = {
        className?: string;
        openUrl: string;
        servicePassword: string | undefined;
        onDialogClose: () => void;
    };

    const CopyOpenButton = memo((props: Props) => {
        const { openUrl, servicePassword, onDialogClose, className } = props;

        const [isReadyToOpen, setReadyToOpen] = useReducer(
            () => true,
            servicePassword === undefined ? true : false
        );

        const copyPasswordToClipBoard = useConstCallback(() => {
            assert(servicePassword !== undefined);
            navigator.clipboard.writeText(servicePassword);
            setReadyToOpen();
        });

        const { ref1, ref2, largerButtonWidth } = (function useClosure() {
            const {
                ref: ref1,
                domRect: { width: width1 }
            } = useDomRect();
            const {
                ref: ref2,
                domRect: { width: width2 }
            } = useDomRect();

            const refWidth = useRef<number>(0);

            const currWidth = width1 === 0 || width2 === 0 ? 0 : Math.max(width1, width2);

            if (currWidth > refWidth.current) {
                refWidth.current = currWidth;
            }

            return {
                ref1,
                ref2,
                "largerButtonWidth": refWidth.current
            };
        })();

        const { classes, cx } = useStyles({ largerButtonWidth });

        const buttonProps = useMemo(
            () =>
                ({
                    "variant": "primary",
                    "href": isReadyToOpen ? openUrl : undefined,
                    "doOpenNewTabIfHref": true,
                    "onClick": isReadyToOpen ? onDialogClose : copyPasswordToClipBoard
                } as const),
            [isReadyToOpen]
        );

        const { t } = useTranslation({ MyServicesCards });

        return (
            <div className={cx(classes.root, className)}>
                <Button
                    startIcon="key"
                    ref={ref2}
                    className={cx(classes.button, { [classes.collapsed]: isReadyToOpen })}
                    {...buttonProps}
                >
                    {t("first copy the password")}
                </Button>
                <Button
                    ref={ref1}
                    className={cx(classes.button, {
                        [classes.collapsed]: !isReadyToOpen
                    })}
                    {...buttonProps}
                >
                    {t("open the service")}
                </Button>
            </div>
        );
    });

    const useStyles = makeStyles<{ largerButtonWidth: number }>({
        "name": { CopyOpenButton }
    })((...[, { largerButtonWidth }]) => ({
        "root": {
            "position": "relative",
            "opacity": largerButtonWidth === 0 ? 0 : 1,
            "transition": `opacity ease-in-out 250ms`
        },
        "button": {
            "minWidth": largerButtonWidth
        },
        "collapsed": {
            "position": "fixed",
            "top": 3000
        }
    }));

    return { CopyOpenButton };
})();
