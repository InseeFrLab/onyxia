import { memo, useRef, useReducer } from "react";
import { makeStyles } from "ui/theme";
import { RoundLogo } from "ui/components/shared/RoundLogo";
import { Button, Text } from "ui/theme";
import { MyServicesSavedConfigOptions } from "./MyServicesSavedConfigOptions";
import type { SavedConfigurationAction } from "./MyServicesSavedConfigOptions";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useTranslation } from "ui/i18n/useTranslations";
import { IconButton } from "ui/theme";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import type { Link } from "type-route";
import { assert } from "tsafe/assert";

export type Props = {
    className?: string;
    isShortVariant: boolean;
    logoUrl: string | undefined;
    friendlyName: string;
    launchLink: Link;
    editLink: Link;
    callback: (action: "copy link" | "delete") => void;
};

export const MyServicesSavedConfig = memo((props: Props) => {
    const {
        isShortVariant,
        friendlyName,
        logoUrl,
        className,
        launchLink,
        editLink,
        callback,
    } = props;

    const { classes, cx } = useStyles({
        "hasLogo": logoUrl !== undefined,
        isShortVariant,
    });

    const onLinkClick = useConstCallback(() => callback("copy link"));

    const { t } = useTranslation({ MyServicesSavedConfig });

    const [isDeletionScheduled, scheduleDeletion] = useReducer(() => true, false);

    useEffectOnValueChange(() => {
        const timer = setTimeout(() => callback("delete"), 700);

        return () => {
            clearTimeout(timer);
        };
    }, [isDeletionScheduled]);

    const editButtonRef = useRef<HTMLButtonElement>(null);

    const configOptionsCallback = useConstCallback((action: SavedConfigurationAction) => {
        switch (action) {
            case "copy link":
            case "delete":
                callback(action);
                break;
            case "edit":
                assert(editButtonRef.current !== null);
                editButtonRef.current.click();
                break;
        }
    });

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
            <div className={classes.linkAndEditButtonWrapper}>
                <IconButton
                    className={classes.linkIcon}
                    iconId="link"
                    onClick={onLinkClick}
                />
                <Button
                    className={classes.editIcon}
                    ref={editButtonRef}
                    {...editLink}
                    doOpenNewTabIfHref={false}
                    variant="secondary"
                >
                    {t("edit")}
                </Button>
            </div>
            <Button {...launchLink} doOpenNewTabIfHref={false} variant="secondary">
                {t("launch")}
            </Button>
            {isShortVariant && (
                <MyServicesSavedConfigOptions callback={configOptionsCallback} />
            )}
        </div>
    );
});

export declare namespace MyServicesSavedConfig {
    export type I18nScheme = {
        "edit": undefined;
        "launch": undefined;
    };
}

const useStyles = makeStyles<{ hasLogo: boolean; isShortVariant: boolean }>({
    "name": { MyServicesSavedConfig },
})((theme, { hasLogo, isShortVariant }) => ({
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
    "editIcon": {
        "marginRight": theme.spacing(3),
    },
    "linkAndEditButtonWrapper": !isShortVariant
        ? {}
        : {
              "width": 0,
              "height": 0,
              "overflow": "hidden",
          },
}));
