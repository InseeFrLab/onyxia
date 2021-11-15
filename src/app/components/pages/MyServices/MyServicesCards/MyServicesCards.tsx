import { useState, memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { makeStyles, Text } from "app/theme";
import { smartTrim } from "app/tools/smartTrim";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { ReactComponent as ServiceNotFoundSvg } from "app/assets/svg/ServiceNotFound.svg";
import MuiLink from "@mui/material/Link";
import type { Link } from "type-route";
import { Dialog } from "onyxia-ui/Dialog";
import { assert } from "tsafe/assert";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Button } from "app/theme";
import { Markdown } from "app/tools/Markdown";
import { symToStr } from "tsafe/symToStr";

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
              isOvertime: boolean;
              postInstallInstructions: string | undefined;
              isShared: boolean;
          }[]
        | undefined;
    catalogExplorerLink: Link;
    onRequestDelete(params: { serviceId: string }): void;
};

export const MyServicesCards = memo((props: Props) => {
    const { className, onRequestDelete, cards, catalogExplorerLink } = props;

    const { classes, cx } = useStyles({
        "isThereServicesRunning": (cards ?? []).length !== 0,
    });

    const { t } = useTranslation("MyServicesCards");

    const onRequestDeleteFactory = useCallbackFactory(([serviceId]: [string]) =>
        onRequestDelete({ serviceId }),
    );

    const [dialogBody, setDialogBody] = useState<string>("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const onRequestShowEnvOrPostInstallInstructionFactory = useCallbackFactory(
        ([showWhat, serviceId]: ["env" | "postInstallInstructions", string]) => {
            assert(cards !== undefined);

            const { postInstallInstructions, env } = cards.find(
                card => card.serviceId === serviceId,
            )!;
            setDialogBody(
                (() => {
                    switch (showWhat) {
                        case "postInstallInstructions":
                            assert(postInstallInstructions !== undefined);

                            return postInstallInstructions;
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
                })(),
            );

            setIsDialogOpen(true);
        },
    );

    const onDialogClose = useConstCallback(() => setIsDialogOpen(false));

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
                            onRequestDelete={onRequestDeleteFactory(card.serviceId)}
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
                    <div style={{ height: 450, "overflow": "auto" }}>
                        <Markdown>{dialogBody}</Markdown>
                    </div>
                }
                isOpen={isDialogOpen}
                onClose={onDialogClose}
                buttons={<Button onClick={onDialogClose}>{t("ok")}</Button>}
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
    "label": { MyServicesCards },
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
}));

const { NoRunningService } = (() => {
    type Props = {
        className: string;
        catalogExplorerLink: Link;
    };

    const NoRunningService = memo((props: Props) => {
        const { className, catalogExplorerLink } = props;

        const { classes, cx } = useStyles();

        const { t } = useTranslation("MyServicesCards");

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
        "label": `${symToStr({ MyServicesCards })}${symToStr({ NoRunningService })}`,
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
