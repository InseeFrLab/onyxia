import { memo } from "react";
import { tss } from "ui/theme";
import { MyServicesSavedConfig } from "./MyServicesSavedConfig";
import type { Props as MyServicesSavedConfigProps } from "./MyServicesSavedConfig";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { CollapsibleSectionHeader } from "onyxia-ui/CollapsibleSectionHeader";
import type { Param0 } from "tsafe";
import { declareComponentKeys } from "i18nifty";

const maxConfigCountInShortVariant = 5;

export type Props = {
    className?: string;
    isShortVariant: boolean;
    savedConfigs: {
        chartIconUrl: string | undefined;
        friendlyName: string;
        /** link.href used as id for callback */
        launchLink: Link;
        editLink: Link;
    }[];
    callback: (params: {
        launchLinkHref: string;
        action: "edit" | "delete" | "copy link";
    }) => void;
    onRequestToggleIsShortVariant(): void;
};

export const MyServicesSavedConfigs = memo((props: Props) => {
    const {
        className,
        savedConfigs,
        isShortVariant,
        callback,
        onRequestToggleIsShortVariant
    } = props;

    const { classes, cx } = useStyles();

    const callbackFactory = useCallbackFactory(
        (
            [launchLinkHref]: [string],
            [action]: [Param0<MyServicesSavedConfigProps["callback"]>]
        ) => callback({ launchLinkHref, action })
    );

    const { t } = useTranslation({ MyServicesSavedConfigs });

    return (
        <div className={cx(classes.root, className)}>
            {(savedConfigs.length !== 0 || !isShortVariant) && (
                <CollapsibleSectionHeader
                    className={classes.header}
                    isCollapsed={isShortVariant}
                    title={t("saved")}
                    showAllStr={t("show all")}
                    total={savedConfigs.length}
                    onToggleIsCollapsed={onRequestToggleIsShortVariant}
                />
            )}
            <div className={classes.wrapper}>
                {savedConfigs
                    .filter(
                        isShortVariant
                            ? (...[, i]) => i < maxConfigCountInShortVariant
                            : () => true
                    )
                    .map(({ chartIconUrl, friendlyName, launchLink, editLink }) => (
                        <MyServicesSavedConfig
                            key={launchLink.href}
                            className={classes.entry}
                            isShortVariant={isShortVariant}
                            chartIconUrl={chartIconUrl}
                            friendlyName={friendlyName}
                            launchLink={launchLink}
                            editLink={editLink}
                            callback={callbackFactory(launchLink.href)}
                        />
                    ))}
            </div>
        </div>
    );
});

export const { i18n } = declareComponentKeys<"saved" | "show all">()({
    MyServicesSavedConfigs
});

const useStyles = tss.withName({ MyServicesSavedConfigs }).create(({ theme }) => ({
    "root": {
        "overflow": "hidden",
        "display": "flex",
        "flexDirection": "column"
    },
    "header": {
        ...theme.spacing.topBottom("margin", 2)
    },
    "entry": {
        "marginBottom": theme.spacing(2)
    },
    "wrapper": {
        "flex": 1,
        "overflow": "auto"
    }
}));
