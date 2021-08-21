import { useState, memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { makeStyles, Text } from "app/theme";

import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { ReactComponent as ServiceNotFoundSvg } from "app/assets/svg/ServiceNotFound.svg";
import MuiLink from "@material-ui/core/Link";
import type { Link } from "type-route";
import { Dialog } from "onyxia-ui/Dialog";
import { assert } from "tsafe/assert";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Button } from "app/theme";
import ReactMarkdown from "react-markdown";

export type Props = {
    className?: string;
    cards:
        | {
              serviceId: string;
              packageIconUrl?: string;
              friendlyName: string;
              packageName: string;
              infoUrl: string;
              openUrl: string | undefined;
              monitoringUrl: string | undefined;
              startTime: number | undefined;
              isOvertime: boolean;
              postInstallInstructions: string | undefined;
          }[]
        | undefined;
    catalogExplorerLink: Link;
    onRequestDelete(params: { serviceId: string }): void;
};

const useStyles = makeStyles<{ isThereServicesRunning: boolean }>()(
    (theme, { isThereServicesRunning }) => ({
        "root": {
            "overflow": "hidden",
            "display": "flex",
            "flexDirection": "column",
        },
        "header": {
            "margin": theme.spacing(3, 0),
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
    }),
);

export const MyServicesCards = memo((props: Props) => {
    const { className, onRequestDelete, cards, catalogExplorerLink } = props;

    const { classes, cx } = useStyles({
        "isThereServicesRunning": (cards ?? []).length !== 0,
    });

    const { t } = useTranslation("MyServicesCards");

    const onRequestDeleteFactory = useCallbackFactory(([serviceId]: [string]) =>
        onRequestDelete({ serviceId }),
    );

    const [postInstallInstructionsDialogBody, setPostInstallInstructionsDialogBody] =
        useState<string>("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const onRequestShowPostInstallInstructionsFactory = useCallbackFactory(
        ([serviceId]: [string]) => {
            assert(cards !== undefined);

            const { postInstallInstructions } = cards.find(
                card => card.serviceId === serviceId,
            )!;

            assert(postInstallInstructions !== undefined);

            setPostInstallInstructionsDialogBody(postInstallInstructions);

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
                            onRequestDelete={onRequestDeleteFactory(card.serviceId)}
                            onRequestShowPostInstallInstructions={
                                card.postInstallInstructions !== undefined
                                    ? onRequestShowPostInstallInstructionsFactory(
                                          card.serviceId,
                                      )
                                    : undefined
                            }
                        />
                    ))
                )}
            </div>
            <Dialog
                body={<ReactMarkdown>{postInstallInstructionsDialogBody}</ReactMarkdown>}
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
    };
}

const { NoRunningService } = (() => {
    type Props = {
        className: string;
        catalogExplorerLink: Link;
    };

    const useStyles = makeStyles()(theme => ({
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
            "margin": theme.spacing(5, 0),
        },
        "typo": {
            "marginBottom": theme.spacing(2),
            "color": theme.colors.palette.light.greyVariant3,
        },
        "link": {
            "cursor": "pointer",
        },
    }));

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

    return { NoRunningService };
})();
