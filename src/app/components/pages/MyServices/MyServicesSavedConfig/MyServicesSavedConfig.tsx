
import { memo, useReducer } from "react";
import { createUseClassNames } from "app/theme";
import Avatar from "@material-ui/core/Avatar";
import { Typography } from "onyxia-ui";
import { cx } from "tss-react";
import { Button } from "app/theme";
import { MyServicesSavedConfigOptions } from "./MyServicesSavedConfigOptions";
import { useConstCallback } from "powerhooks";
import { useTranslation } from "app/i18n/useTranslations";
import { IconButton } from "app/theme";
import { useEffectOnValueChange } from "powerhooks";

const actions = ["launch", "delete", "copy link"] as const;

export type MyServicesSavedConfigAction = typeof actions[number];

const { useClassNames } = createUseClassNames<{ hasLogo: boolean; }>()(
    (theme,{ hasLogo }) => ({
        "root": {
            "borderRadius": 16,
            "boxShadow": theme.shadows[1],
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "&:hover": {
                "boxShadow": theme.shadows[6]
            },
            "display": "flex",
            "alignItems": "center",
            "padding": theme.spacing(1, 1),
            "paddingRight": theme.spacing(2),
        },
        "avatar": {
            ...(() => {
                const width = 32;
                return { width, "height": width };
            })(),
            "visibility": hasLogo ? undefined : "hidden",
            "margin": theme.spacing(0,1)
        },
        "friendlyNameWrapper": {
            "overflow": "hidden",
            "whiteSpace": "nowrap",
            "flex": 1
        },
        "friendlyName": {
            "overflow": "hidden",
            "text-overflow": "ellipsis"
        },
        "linkIcon": {
            "marginRight": theme.spacing(2)
        }
    })
);

export type Props = {
    className?: string;
    isShortVariant: boolean;
    logoUrl?: string;
    friendlyName: string;
    callback(action: MyServicesSavedConfigAction): void;
};

export const MyServicesSavedConfig = memo(
    (props: Props) => {

        const {
            isShortVariant,
            friendlyName,
            logoUrl,
            className,
            callback
        } = props;

        const { classNames } = useClassNames({ "hasLogo": logoUrl !==undefined  });

        const onButtonClick = useConstCallback(() => callback("launch"));

        const onLinkClick = useConstCallback(() => callback("copy link"));

        const { t } = useTranslation("MyServicesSavedConfig");

        const [isDeletionScheduled, scheduleDeletion] =
            useReducer(() => true, false);

        useEffectOnValueChange(
            () => {

                const timer = setTimeout(scheduleDeletion, 700);

                return () => { clearTimeout(timer); };

            },
            [isDeletionScheduled]
        );

        return (
            <div className={cx(classNames.root, className)}>
                { !isShortVariant &&
                    <IconButton
                        id={isDeletionScheduled ? "bookmarkBorder" : "bookmark"}
                        onClick={scheduleDeletion}
                    />
                }
                <Avatar src={logoUrl} className={classNames.avatar} />
                <div className={classNames.friendlyNameWrapper}>
                    <Typography
                        variant="h6"
                        className={classNames.friendlyName}
                    >
                        {friendlyName}
                    </Typography>
                </div>
                {!isShortVariant && <IconButton
                    className={classNames.linkIcon}
                    id="link"
                    onClick={onLinkClick}
                />}
                <Button onClick={onButtonClick} color="secondary">{t("launch")}</Button>
                {isShortVariant &&
                    <MyServicesSavedConfigOptions callback={callback} />}
            </div>
        );

    }
);

export declare namespace MyServicesSavedConfig {

    export type I18nScheme = {
        "launch": undefined;
    };

}
