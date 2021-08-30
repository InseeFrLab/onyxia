import { memo, useReducer } from "react";
import { makeStyles } from "app/theme";
import { RoundLogo } from "app/components/shared/RoundLogo";

import { Button, Text } from "app/theme";
import { MyServicesSavedConfigOptions } from "./MyServicesSavedConfigOptions";
import type { SavedConfigurationAction } from "./MyServicesSavedConfigOptions";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useTranslation } from "app/i18n/useTranslations";
import { IconButton } from "app/theme";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import type { Link } from "type-route";

const useStyles = makeStyles<{ hasLogo: boolean }>()((theme, { hasLogo }) => ({
    "root": {
        "borderRadius": 16,
        "boxShadow": theme.shadows[1],
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "&:hover": {
            "boxShadow": theme.shadows[6],
        },
        "display": "flex",
        "alignItems": "center",
        "padding": theme.spacing(2),
        "paddingRight": theme.spacing(3),
    },
    "logo": {
        "visibility": hasLogo ? undefined : "hidden",
        ...theme.spacing.rightLeft("margin", 2),
    },
    "friendlyNameWrapper": {
        "overflow": "hidden",
        "whiteSpace": "nowrap",
        "flex": 1,
    },
    "friendlyName": {
        "overflow": "hidden",
        "textOverflow": "ellipsis",
    },
    "linkIcon": {
        "marginRight": theme.spacing(3),
    },
}));

export type Props = {
    className?: string;
    isShortVariant: boolean;
    logoUrl: string | undefined;
    friendlyName: string;
    link: Link;
    callback: (action: SavedConfigurationAction) => void;
};

export const MyServicesSavedConfig = memo((props: Props) => {
    const { isShortVariant, friendlyName, logoUrl, className, link, callback } = props;

    const { classes, cx } = useStyles({ "hasLogo": logoUrl !== undefined });

    const onLinkClick = useConstCallback(() => callback("copy link"));

    const { t } = useTranslation("MyServicesSavedConfig");

    const [isDeletionScheduled, scheduleDeletion] = useReducer(() => true, false);

    useEffectOnValueChange(() => {
        const timer = setTimeout(() => callback("delete"), 700);

        return () => {
            clearTimeout(timer);
        };
    }, [isDeletionScheduled]);

    return (
        <div className={cx(classes.root, className)}>
            {!isShortVariant && (
                <IconButton
                    iconId={isDeletionScheduled ? "bookmarkBorder" : "bookmark"}
                    onClick={scheduleDeletion}
                />
            )}
            <RoundLogo url={logoUrl} className={classes.logo} size="medium" />
            <div className={classes.friendlyNameWrapper}>
                <Text typo="label 1" className={classes.friendlyName}>
                    {friendlyName}
                </Text>
            </div>
            {!isShortVariant && (
                <IconButton
                    className={classes.linkIcon}
                    iconId="link"
                    onClick={onLinkClick}
                />
            )}
            <Button {...link} variant="secondary">
                {t("launch")}
            </Button>
            {isShortVariant && <MyServicesSavedConfigOptions callback={callback} />}
        </div>
    );
});

export declare namespace MyServicesSavedConfig {
    export type I18nScheme = {
        "launch": undefined;
    };
}
