
import { memo, useReducer } from "react";
import { createUseClassNames } from "app/theme";
import { RoundLogo } from "app/components/shared/RoundLogo";
import { Typography } from "onyxia-ui";
import { cx } from "tss-react";
import { Button } from "app/theme";
import { MyServicesSavedConfigOptions } from "./MyServicesSavedConfigOptions";
import { useConstCallback } from "powerhooks";
import { useTranslation } from "app/i18n/useTranslations";
import { IconButton } from "app/theme";
import { useEffectOnValueChange } from "powerhooks";
import type { Link } from "type-route";

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
        "logo": {
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
            "textOverflow": "ellipsis"
        },
        "linkIcon": {
            "marginRight": theme.spacing(2)
        }
    })
);

export type Props = {
    className?: string;
    isShortVariant: boolean;
    logoUrl: string | undefined;
    friendlyName: string;
    link: Link;
    callback(action: "delete" | "copy link"): void;
};

export const MyServicesSavedConfig = memo(
    (props: Props) => {

        const {
            isShortVariant,
            friendlyName,
            logoUrl,
            className,
            link,
            callback
        } = props;

        const { classNames } = useClassNames({ "hasLogo": logoUrl !==undefined  });


        const onLinkClick = useConstCallback(() => callback("copy link"));

        const { t } = useTranslation("MyServicesSavedConfig");

        const [isDeletionScheduled, scheduleDeletion] =
            useReducer(() => true, false);

        useEffectOnValueChange(
            () => {

                const timer = setTimeout(()=>callback("delete"), 700);

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
                <RoundLogo url={logoUrl} className={classNames.logo} />
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
                <Button 
                    {...link}
                    color="secondary"
                >
                    {t("launch")}
                </Button>
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
