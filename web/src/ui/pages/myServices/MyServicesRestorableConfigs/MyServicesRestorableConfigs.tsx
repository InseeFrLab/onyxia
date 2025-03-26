import { memo } from "react";
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
        index_new: number;
    }) => void;
    onRequestDelete: (params: {
        restorableConfigRef: RestorableServiceConfigRef;
    }) => void;
    onRequestRename: (params: {
        restorableConfigRef: RestorableServiceConfigRef;
        friendlyName_new: string;
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
            [params]: [{ friendlyName_new: string }]
        ) => {
            const { friendlyName_new } = params;
            onRequestRename({
                restorableConfigRef: { friendlyName, catalogId, chartName },
                friendlyName_new
            });
        }
    );

    const onConfigRequestToMoveFactory = useCallbackFactory(
        (
            [friendlyName, catalogId, chartName]: [string, string, string],
            [params]: [{ direction: "up" | "down" }]
        ) => {
            const { direction } = params;

            const index_current = entries.findIndex(entry =>
                getAreSameRestorableConfigRef(entry.restorableConfigRef, {
                    friendlyName,
                    catalogId,
                    chartName
                })
            );

            assert(index_current !== -1);

            const index_new: number = (() => {
                switch (direction) {
                    case "up":
                        return index_current - 1;
                    case "down":
                        return index_current + 1;
                }
            })();

            onRequestToMove({
                restorableConfigRef: {
                    friendlyName,
                    catalogId,
                    chartName
                },
                index_new: index_new
            });
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
                    ) => {
                        return (
                            <MyServicesRestorableConfig
                                key={JSON.stringify(ref)}
                                className={classes.entry}
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
                            />
                        );
                    }
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
    wrapper: {
        flex: 1,
        overflow: "auto"
    }
}));
