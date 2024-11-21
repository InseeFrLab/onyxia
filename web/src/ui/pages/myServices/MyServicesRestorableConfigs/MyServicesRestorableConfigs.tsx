import { memo } from "react";
import { tss } from "tss";
import { MyServicesRestorableConfig } from "./MyServicesRestorableConfig";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { CollapsibleSectionHeader } from "onyxia-ui/CollapsibleSectionHeader";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";

export type Props = {
    className?: string;
    isShortVariant: boolean;
    entries: {
        restorableConfigIndex: number;
        chartIconUrl: string | undefined;
        friendlyName: string;
        /** link.href used as id for callback */
        launchLink: Link;
        editLink: Link;
    }[];
    onRequestDelete: (params: { restorableConfigIndex: number }) => void;
    onRequestToggleIsShortVariant: () => void;
};

export const MyServicesRestorableConfigs = memo((props: Props) => {
    const {
        className,
        entries,
        isShortVariant,
        onRequestDelete,
        onRequestToggleIsShortVariant
    } = props;

    const { classes, cx } = useStyles();

    const onRequestDeleteFactory = useCallbackFactory(
        ([restorableConfigIndex]: [number]) => onRequestDelete({ restorableConfigIndex })
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
                    ({
                        restorableConfigIndex,
                        chartIconUrl,
                        friendlyName,
                        launchLink,
                        editLink
                    }) => (
                        <MyServicesRestorableConfig
                            key={launchLink.href}
                            className={classes.entry}
                            isShortVariant={isShortVariant}
                            chartIconUrl={chartIconUrl}
                            friendlyName={friendlyName}
                            launchLink={launchLink}
                            editLink={editLink}
                            onRequestDelete={onRequestDeleteFactory(
                                restorableConfigIndex
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
    wrapper: {
        flex: 1,
        overflow: "auto"
    }
}));
