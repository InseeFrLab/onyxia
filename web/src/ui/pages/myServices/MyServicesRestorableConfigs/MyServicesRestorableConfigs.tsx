import { memo, useState } from "react";
import { tss } from "tss";
import { MyServicesRestorableConfig } from "./MyServicesRestorableConfig";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { CollapsibleSectionHeader } from "onyxia-ui/CollapsibleSectionHeader";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";
import { assert } from "tsafe/assert";
import {
    type RestorableServiceConfigRef,
    getAreSameRestorableConfigRef
} from "core/usecases/restorableConfigManagement";

export type Props = {
    className?: string;
    isShortVariant: boolean;
    entries: {
        restorableConfigRef: RestorableServiceConfigRef;
        chartIconUrl: string | undefined;
        launchLink: Link;
        editLink: Link;
    }[];
    onRequestToMove: (params: {
        restorableConfigRef: RestorableServiceConfigRef;
        targetIndex: number;
    }) => void;
    onRequestDelete: (params: {
        restorableConfigRef: RestorableServiceConfigRef;
    }) => void;
    onRequestRename: (params: {
        restorableConfigRef: RestorableServiceConfigRef;
        newFriendlyName: string;
    }) => void;
    onRequestToggleIsShortVariant: () => void;
};

export const MyServicesRestorableConfigs = memo((props: Props) => {
    const {
        className,
        entries,
        isShortVariant,
        onRequestDelete,
        onRequestToggleIsShortVariant,
        onRequestToMove,
        onRequestRename
    } = props;

    const [lastCardMoved, setLastCardMoved] = useState<
        RestorableServiceConfigRef | undefined
    >(undefined);

    const { classes, cx } = useStyles();

    const onRequestDeleteFactory = useCallbackFactory(
        ([friendlyName, catalogId, chartName]: [string, string, string]) =>
            onRequestDelete({
                restorableConfigRef: { friendlyName, catalogId, chartName }
            })
    );

    const onRequestRenameFactory = useCallbackFactory(
        (
            [friendlyName, catalogId, chartName]: [string, string, string],
            [params]: [{ newFriendlyName: string }]
        ) => {
            const { newFriendlyName } = params;
            onRequestRename({
                restorableConfigRef: { friendlyName, catalogId, chartName },
                newFriendlyName
            });
        }
    );

    const onConfigRequestToMoveFactory = useCallbackFactory(
        (
            [friendlyName, catalogId, chartName]: [string, string, string],
            [params]: [{ direction: "up" | "down" | "top" | "bottom" }]
        ) => {
            const { direction } = params;

            const currentIndex = entries.findIndex(entry =>
                getAreSameRestorableConfigRef(entry.restorableConfigRef, {
                    friendlyName,
                    catalogId,
                    chartName
                })
            );

            assert(currentIndex !== -1);

            const targetIndex: number = (() => {
                switch (direction) {
                    case "up":
                        return currentIndex - 1;
                    case "down":
                        return currentIndex + 1;
                    case "top":
                        return 0;
                    case "bottom":
                        return entries.length - 1;
                }
            })();

            onRequestToMove({
                restorableConfigRef: {
                    friendlyName,
                    catalogId,
                    chartName
                },
                targetIndex
            });

            // We need this setTimeout to be sure animation is well played even if the card moved is the same as the last one
            setLastCardMoved(undefined);
            setTimeout(() => {
                setLastCardMoved({ friendlyName, catalogId, chartName });
            }, 0);
        }
    );

    const { t } = useTranslation({ MyServicesRestorableConfigs });

    return (
        <div className={cx(classes.root, className)}>
            {(entries.length !== 0 || !isShortVariant) && (
                <CollapsibleSectionHeader
                    className={classes.header}
                    isCollapsed={isShortVariant}
                    title={t("saved")}
                    showAllStr={t("expand")}
                    total={entries.length}
                    onToggleIsCollapsed={onRequestToggleIsShortVariant}
                />
            )}
            <div className={classes.wrapper}>
                {entries.map(
                    (
                        { restorableConfigRef: ref, chartIconUrl, launchLink, editLink },
                        index
                    ) => (
                        <MyServicesRestorableConfig
                            key={JSON.stringify(ref)}
                            className={cx(
                                classes.entry,
                                lastCardMoved &&
                                    getAreSameRestorableConfigRef(ref, lastCardMoved) &&
                                    classes.movedHighlight
                            )}
                            isShortVariant={isShortVariant}
                            chartIconUrl={chartIconUrl}
                            friendlyName={ref.friendlyName}
                            launchLink={launchLink}
                            editLink={editLink}
                            isFirst={index === 0}
                            isLast={index === entries.length - 1}
                            onRequestDelete={onRequestDeleteFactory(
                                ref.friendlyName,
                                ref.catalogId,
                                ref.chartName
                            )}
                            onRequestToMove={onConfigRequestToMoveFactory(
                                ref.friendlyName,
                                ref.catalogId,
                                ref.chartName
                            )}
                            onRequestRename={onRequestRenameFactory(
                                ref.friendlyName,
                                ref.catalogId,
                                ref.chartName
                            )}
                        />
                    )
                )}
            </div>
        </div>
    );
});

MyServicesRestorableConfigs.displayName = symToStr({ MyServicesRestorableConfigs });

const { i18n } = declareComponentKeys<"saved" | "expand">()({
    MyServicesRestorableConfigs
});
export type I18n = typeof i18n;

const useStyles = tss.withName({ MyServicesRestorableConfigs }).create(({ theme }) => ({
    root: {
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
    },
    header: {
        ...theme.spacing.topBottom("margin", 2)
    },
    entry: {
        marginBottom: theme.spacing(2)
    },
    movedHighlight: {
        animation: "flash 0.6s ease-out",
        animationFillMode: "forwards", // pour ne pas revenir au style initial brutalement
        "@keyframes flash": {
            "0%": {
                backgroundColor: theme.colors.useCases.surfaces.background,
                opacity: 0.7
            },
            "50%": {
                backgroundColor: theme.colors.useCases.surfaces.surface2,
                opacity: 1
            },
            "100%": {
                //backgroundColor: "transparent",
                opacity: 1
            }
        }
    },
    wrapper: {
        flex: 1,
        overflow: "auto"
    }
}));
