import { memo } from "react";
import { makeStyles } from "app/theme";

import { MyServicesSavedConfig } from "./MyServicesSavedConfig";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useTranslation } from "app/i18n/useTranslations";
import type { Link } from "type-route";
import { CollapsibleSectionHeader } from "onyxia-ui/CollapsibleSectionHeader";

const useStyles = makeStyles()(theme => ({
    "root": {
        "overflow": "hidden",
        "display": "flex",
        "flexDirection": "column",
    },
    "header": {
        ...theme.spacing.topBottom("margin", 2),
    },
    "entry": {
        "marginBottom": theme.spacing(2),
    },
    "wrapper": {
        "flex": 1,
        "overflow": "auto",
    },
}));

const maxConfigCountInShortVariant = 5;

export type Props = {
    className?: string;
    isShortVariant: boolean;
    savedConfigs: {
        logoUrl: string | undefined;
        friendlyName: string;
        /** link.href used as id for callback */
        link: Link;
    }[];
    callback(params: { linkHref: string; action: "delete" | "copy link" }): void;
    onRequestToggleIsShortVariant(): void;
};

export const MyServicesSavedConfigs = memo((props: Props) => {
    const {
        className,
        savedConfigs,
        isShortVariant,
        callback,
        onRequestToggleIsShortVariant,
    } = props;

    const { classes, cx } = useStyles();

    const callbackFactory = useCallbackFactory(
        ([linkHref]: [string], [action]: ["delete" | "copy link"]) =>
            callback({ linkHref, action }),
    );

    const { t } = useTranslation("MyServicesSavedConfigs");

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
                            : () => true,
                    )
                    .map(({ logoUrl, friendlyName, link }) => (
                        <MyServicesSavedConfig
                            key={link.href}
                            className={classes.entry}
                            isShortVariant={isShortVariant}
                            logoUrl={logoUrl}
                            friendlyName={friendlyName}
                            link={link}
                            callback={callbackFactory(link.href)}
                        />
                    ))}
            </div>
        </div>
    );
});

export declare namespace MyServicesSavedConfigs {
    export type I18nScheme = {
        saved: undefined;
        "show all": undefined;
    };
}
