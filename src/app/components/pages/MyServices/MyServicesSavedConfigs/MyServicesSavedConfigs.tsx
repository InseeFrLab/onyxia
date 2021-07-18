import { memo } from "react";
import { makeStyles } from "app/theme";

import { MyServicesSavedConfig } from "./MyServicesSavedConfig";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useTranslation } from "app/i18n/useTranslations";
import { IconButton, Text } from "app/theme";
import MuiLink from "@material-ui/core/Link";
import type { Link } from "type-route";

const { useStyles } = makeStyles()(theme => ({
    "root": {
        "overflow": "hidden",
        "display": "flex",
        "flexDirection": "column",
    },
    "entry": {
        "marginBottom": theme.spacing(1),
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
    callback(params: {
        linkHref: string;
        action: "delete" | "copy link";
    }): void;
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

    return (
        <div className={cx(classes.root, className)}>
            {(savedConfigs.length !== 0 || !isShortVariant) && (
                <Header
                    isShortVariant={isShortVariant}
                    configCount={savedConfigs.length}
                    onRequestToggleIsShortVariant={
                        onRequestToggleIsShortVariant
                    }
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
        "show all": { n: string };
    };
}

const { Header } = (() => {
    type Props = {
        className?: string;
        isShortVariant: boolean;
        onRequestToggleIsShortVariant(): void;
        configCount: number;
    };

    const { useStyles } = makeStyles()(theme => ({
        "root": {
            "margin": theme.spacing(2, 0),
            "display": "flex",
            "alignItems": "center",
        },
        "chevron": {
            "paddingLeft": 0,
        },
        "link": {
            "cursor": "pointer",
        },
    }));

    const Header = memo((props: Props) => {
        const {
            className,
            isShortVariant,
            onRequestToggleIsShortVariant,
            configCount,
        } = props;

        const { classes, cx } = useStyles();

        const { t } = useTranslation("MyServicesSavedConfigs");

        return (
            <div className={cx(classes.root, className)}>
                {!isShortVariant && (
                    <IconButton
                        className={classes.chevron}
                        size="large"
                        iconId="chevronLeft"
                        onClick={onRequestToggleIsShortVariant}
                    />
                )}
                <Text typo="section heading">{t("saved")}</Text>
                <div style={{ "flex": "1" }} />
                {isShortVariant && (
                    <MuiLink
                        onClick={onRequestToggleIsShortVariant}
                        className={classes.link}
                    >
                        {t("show all", { "n": `${configCount}` })}
                    </MuiLink>
                )}
            </div>
        );
    });

    return { Header };
})();
