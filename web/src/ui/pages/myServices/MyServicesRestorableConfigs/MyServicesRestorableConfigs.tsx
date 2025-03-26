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

export type Props = {
    className?: string;
    isShortVariant: boolean;
    entries: {
        restorableConfigId: string;
        chartIconUrl: string | undefined;
        friendlyName: string;
        /** link.href used as id for callback */
        launchLink: Link;
        editLink: Link;
    }[];
    onRequestToMove: (params: { restorableConfigId: string; toIndex: number }) => void;

    onRequestDelete: (params: { restorableConfigId: string }) => void;
    onRequestToggleIsShortVariant: () => void;
};

export const MyServicesRestorableConfigs = memo((props: Props) => {
    const {
        className,
        entries,
        isShortVariant,
        onRequestDelete,
        onRequestToggleIsShortVariant,
        onRequestToMove
    } = props;

    const { classes, cx } = useStyles();

    const onRequestDeleteFactory = useCallbackFactory(([restorableConfigId]: [string]) =>
        onRequestDelete({ restorableConfigId })
    );

    const onConfigRequestToMoveFactory = useCallbackFactory(
        ([restorableConfigId]: [string], [params]: [{ direction: "up" | "down" }]) => {
            const { direction } = params;

            const index_current = entries.findIndex(entry => entry.restorableConfigId);

            assert(index_current !== -1);

            const index_target: number = (() => {
                switch (direction) {
                    case "up":
                        return index_current - 1;
                    case "down":
                        return index_current + 1;
                }
            })();

            onRequestToMove({ restorableConfigId, toIndex: index_target });
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
                        {
                            restorableConfigId,
                            chartIconUrl,
                            friendlyName,
                            launchLink,
                            editLink
                        },
                        index
                    ) => {
                        console.log("restorableConfigId", restorableConfigId);
                        return (
                            <MyServicesRestorableConfig
                                key={restorableConfigId}
                                className={classes.entry}
                                isShortVariant={isShortVariant}
                                chartIconUrl={chartIconUrl}
                                friendlyName={friendlyName}
                                launchLink={launchLink}
                                editLink={editLink}
                                isFirst={index === 0}
                                isLast={index === entries.length - 1}
                                onRequestDelete={onRequestDeleteFactory(
                                    restorableConfigId
                                )}
                                onRequestToMove={onConfigRequestToMoveFactory(
                                    restorableConfigId
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
