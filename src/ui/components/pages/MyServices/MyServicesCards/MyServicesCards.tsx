import { useState, useMemo, useReducer, memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { makeStyles, Text } from "ui/theme";
import { smartTrim } from "ui/tools/smartTrim";
import { useTranslation } from "ui/i18n/useTranslations";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { ReactComponent as ServiceNotFoundSvg } from "ui/assets/svg/ServiceNotFound.svg";
import MuiLink from "@mui/material/Link";
import type { Link } from "type-route";
import { Dialog } from "onyxia-ui/Dialog";
import { assert } from "tsafe/assert";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Button } from "ui/theme";
import { Markdown } from "ui/tools/Markdown";
import { symToStr } from "tsafe/symToStr";
import { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import * as clipboard from "clipboard-polyfill/text";

export type Props = {
    className?: string;
    cards:
        | {
              serviceId: string;
              packageIconUrl?: string;
              friendlyName: string;
              packageName: string;
              infoUrl: string;
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
        getServicePassword,
    } = props;

    const { classes, cx } = useStyles({
        "isThereServicesRunning": (cards ?? []).length !== 0,
    });

    const { t } = useTranslation({ MyServicesCards });

    const onRequestDeleteFactory = useCallbackFactory(([serviceId]: [string]) =>
        onRequestDelete({ serviceId }),
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
                        "servicePassword": await getServicePassword(),
                    });
                    break;
            }
        },
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
                        serviceId,
                    )(),
            ),
        [evtAction],
    );

    const { dialogBody, dialogButton: dialogButtons } = useMemo(() => {
        if (dialogDesc === undefined) {
            return {};
        }

        assert(cards !== undefined);

        const { postInstallInstructions, env, openUrl } = cards.find(
            card => card.serviceId === dialogDesc.serviceId,
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
                                        "maxLength": 40,
                                    })}\`  `,
                            )
                            .join("\n"),
                        "  \n",
                        `**${t("need to copy")}**`,
                        t("everything have been printed to the console"),
                        "*Windows/Linux*: `Shift + CTRL + J`",
                        "*Mac*: `⌥ + ⌘ + J`",
                    ].join("  \n");
            }
        })();

        const dialogButton = (() => {
            switch (dialogDesc.dialogShowingWhat) {
                case "postInstallInstructions":
                    return (
                        <>
                            <Button variant="secondary" onClick={onDialogClose}>
                                Cancel
                            </Button>
                            {openUrl && (
                                <CopyOpenButton
                                    openUrl={openUrl}
                                    servicePassword={
                                        postInstallInstructions !== undefined &&
                                        postInstallInstructions.indexOf(
                                            dialogDesc.servicePassword,
                                        ) >= 0
                                            ? dialogDesc.servicePassword
                                            : undefined
                                    }
                                />
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
            </Text>
            <div className={classes.wrapper}>
                {cards !== undefined && cards.length === 0 ? (
                    <NoRunningService
                        className={classes.noRunningServices}
                        catalogExplorerLink={catalogExplorerLink}
                    />
                ) : (
                    cards?.map(card => (
                        <MyServicesCard
                            key={card.serviceId}
                            {...card}
                            onRequestShowEnv={onRequestShowEnvOrPostInstallInstructionFactory(
                                "env",
                                card.serviceId,
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
                                          card.serviceId,
                                      )
                                    : undefined
                            }
                        />
                    ))
                )}
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

export declare namespace MyServicesCards {
    export type I18nScheme = {
        "running services": undefined;
        "no services running": undefined;
        "launch one": undefined;
        ok: undefined;
        "need to copy": undefined;
        "everything have been printed to the console": undefined;
    };
}

const useStyles = makeStyles<{ isThereServicesRunning: boolean }>({
    "name": { MyServicesCards },
})((theme, { isThereServicesRunning }) => ({
    "root": {
        "overflow": "hidden",
        "display": "flex",
        "flexDirection": "column",
    },
    "header": {
        ...theme.spacing.topBottom("margin", 3),
    },
    "wrapper": {
        "overflow": "auto",
        ...(!isThereServicesRunning
            ? {
                  "flex": 1,
              }
            : {
                  "paddingRight": theme.spacing(3),
                  "display": "grid",
                  "gridTemplateColumns": "repeat(2,1fr)",
                  "gap": theme.spacing(4),
              }),
    },
    "noRunningServices": {
        "height": "100%",
    },
    "dialogBody": {
        "maxHeight": 450,
        "overflow": "auto",
    },
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
        "name": `${symToStr({ MyServicesCards })}${symToStr({ NoRunningService })}`,
    })(theme => ({
        "root": {
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center",
        },
        "innerDiv": {
            "textAlign": "center",
            "maxWidth": 500,
        },
        "svg": {
            "fill": theme.colors.palette.dark.greyVariant2,
            "width": 100,
            "margin": 0,
        },
        "h2": {
            ...theme.spacing.topBottom("margin", 5),
        },
        "typo": {
            "marginBottom": theme.spacing(2),
            "color": theme.colors.palette.light.greyVariant3,
        },
        "link": {
            "cursor": "pointer",
        },
    }));

    return { NoRunningService };
})();

const { CopyOpenButton } = (() => {
    type Props = {
        openUrl: string;
        servicePassword: string | undefined;
    };

    const CopyOpenButton = memo((props: Props) => {
        const { openUrl, servicePassword } = props;

        const [isReadyToOpen, setReadyToOpen] = useReducer(
            () => true,
            servicePassword === undefined ? true : false,
        );

        const copyPasswordToClipBoard = useConstCallback(() => {
            clipboard.writeText(servicePassword!);
            setReadyToOpen();
        });

        return (
            <Button
                variant="primary"
                href={isReadyToOpen ? openUrl : undefined}
                doOpenNewTabIfHref={true}
                onClick={isReadyToOpen ? undefined : copyPasswordToClipBoard}
            >
                {isReadyToOpen ? "Open the service🚀" : "📋 First copy the password..."}
            </Button>
        );
    });

    return { CopyOpenButton };
})();
