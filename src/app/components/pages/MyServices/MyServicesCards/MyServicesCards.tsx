
import { useState, memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { useTranslation } from "app/i18n/useTranslations";
import { Typography } from "onyxia-ui";
import { useCallbackFactory } from "powerhooks";
import { ReactComponent as ServiceNotFoundSvg } from "app/assets/svg/ServiceNotFound.svg";
import MuiLink from "@material-ui/core/Link";
import type { Link } from "type-route";
import { Dialog } from "onyxia-ui";
import { assert } from "tsafe/assert";
import { useConstCallback } from "powerhooks";
import { Button } from "app/theme";
import ReactMarkdown from "react-markdown";

export type Props = {
    className?: string;
    cards: {
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
    }[] | undefined;
    catalogExplorerLink: Link;
    onRequestDelete(params: { serviceId: string; }): void;
}

const { useClassNames } = createUseClassNames<{ isThereServicesRunning: boolean; }>()(
    (theme, { isThereServicesRunning }) => ({
        "root": {
            "overflow": "hidden",
            "display": "flex",
            "flexDirection": "column"
        },
        "header": {
            "margin": theme.spacing(2, 0),
        },
        "wrapper": {
            "overflow": "auto",
            ...(!isThereServicesRunning ? {
                "flex": 1
            } : {
                "paddingRight": theme.spacing(2),
                "display": "grid",
                "gridTemplateColumns": "repeat(2,1fr)",
                "gap": theme.spacing(3)
            }),
        },
        "noRunningServices": {
            "height": "100%"
        }
    })
);

export const MyServicesCards = memo(
    (props: Props) => {

        const { className, onRequestDelete, cards, catalogExplorerLink } = props;

        const { classNames } = useClassNames({ "isThereServicesRunning": (cards ?? []).length !== 0 });

        const { t } = useTranslation("MyServicesCards");

        const onRequestDeleteFactory = useCallbackFactory(
            ([serviceId]: [string]) => onRequestDelete({ serviceId })
        );

        const [postInstallInstructionsDialogBody, setPostInstallInstructionsDialogBody] = useState<string>("");

        const [isDialogOpen, setIsDialogOpen] = useState(false);

        const onRequestShowPostInstallInstructionsFactory = useCallbackFactory(
            ([serviceId]: [string]) => {

                assert(cards !== undefined);

                const { postInstallInstructions } = cards.find(card => card.serviceId === serviceId)!;

                assert(postInstallInstructions !== undefined);

                setPostInstallInstructionsDialogBody(postInstallInstructions);

                setIsDialogOpen(true);

            }
        );

        const onDialogClose = useConstCallback(() => setIsDialogOpen(false));

        return (
            <div className={cx(classNames.root, className)}>
                <Typography variant="h4" className={classNames.header}>
                    {t("running services")}
                </Typography>
                <div className={classNames.wrapper}>
                    {
                        cards !== undefined && cards.length === 0 ?
                            <NoRunningService
                                className={classNames.noRunningServices}
                                catalogExplorerLink={catalogExplorerLink}
                            /> :
                            cards?.map(card =>
                                <MyServicesCard
                                    key={card.serviceId}
                                    {...card}
                                    onRequestDelete={onRequestDeleteFactory(card.serviceId)}
                                    onRequestShowPostInstallInstructions={
                                        card.postInstallInstructions !== undefined ?
                                            onRequestShowPostInstallInstructionsFactory(card.serviceId) :
                                            undefined
                                    }
                                />
                            )
                    }
                </div>
                <Dialog
                    body={
                        <ReactMarkdown>
                            {postInstallInstructionsDialogBody}
                        </ReactMarkdown>
                    }
                    isOpen={isDialogOpen}
                    onClose={onDialogClose}
                    buttons={
                        <Button onClick={onDialogClose}>
                            {t("ok")}
                        </Button>
                    }
                />
            </div>
        )

    }
);

export declare namespace MyServicesCards {

    export type I18nScheme = {
        'running services': undefined;
        'no services running': undefined;
        'launch one': undefined;
        ok: undefined;
    };

}


const { NoRunningService } = (() => {

    type Props = {
        className: string;
        catalogExplorerLink: Link;
    };

    const { useClassNames } = createUseClassNames()(
        theme => ({
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
                "margin": theme.spacing(4, 0)
            },
            "typo": {
                "marginBottom": theme.spacing(1),
                "color": theme.colors.palette.light.greyVariant3
            },
            "link": {
                "cursor": "pointer"
            }
        })
    );

    const NoRunningService = memo(
        (props: Props) => {

            const { className, catalogExplorerLink } = props;

            const { classNames } = useClassNames({});

            const { t } = useTranslation("MyServicesCards");

            return (
                <div className={cx(classNames.root, className)}>

                    <div className={classNames.innerDiv}>
                        <ServiceNotFoundSvg className={classNames.svg} />
                        <Typography
                            variant="h2"
                            className={classNames.h2}
                        >{t("no services running")}</Typography>
                        <MuiLink
                            className={classNames.link}
                            {...catalogExplorerLink}
                        >
                            {t("launch one")}
                        </MuiLink>
                    </div>
                </div>
            );

        }
    );

    return { NoRunningService };

})();
