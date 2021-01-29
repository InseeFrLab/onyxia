
import { memo } from "react";
import { IconButton } from "app/components/designSystem/IconButton";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "app/utils/hooks/useCallbackFactory";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames, cx, css, useTheme } from "app/theme/useClassNames";
import { useDOMRect } from "app/utils/hooks/useDOMRect";
import { Typography } from "app/components/designSystem/Typography";

type Target = "logo" | "cloudShell" | "auth button";

export type Props = {
    className?: string;
    isUserLoggedIn: boolean;
    onClick(target: Target): void;
    logoWidthInPercent: number;
    paddingRightInPercent: number;
};

const logoWidth = 53;

const { useClassNames } = createUseClassNames<Props & { width: number; }>()(
    ({ theme }, { logoWidthInPercent, paddingRightInPercent, width }) => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
            "display": "flex",
            "paddingRight": width * (paddingRightInPercent / 100)
        },
        "logoContainer": {
            "cursor": "pointer",
            "width": Math.max(width * (logoWidthInPercent / 100), logoWidth),
            "textAlign": "center"
        }
    })
);

export const Header = memo((props: Props) => {

    const { isUserLoggedIn, onClick, className = undefined } = props;


    const { t } = useTranslation("Header");

    const onClickFactory = useCallbackFactory(
        ([target]: [Target]) => onClick(target),
        [onClick]
    );

    const { domRect: { width, height }, ref } = useDOMRect();

    const { classNames } = useClassNames({ ...props, width });

    const theme = useTheme();

    return (
        <div className={cx(classNames.root, className)} ref={ref}>
            <div
                onClick={onClickFactory("logo")}
                className={classNames.logoContainer}
            >
                <HeaderLogoSvg
                    width={logoWidth}
                    height={height}
                />
            </div>
            <div
                onClick={onClickFactory("logo")}
                className={css({
                    "display": "flex",
                    "justifyContent": "center",
                    "alignItems": "center",
                    "cursor": "pointer"
                })}>

                <Typography
                    variant="h4"
                    className={css({ "fontWeight": 600 })}
                >
                    Onyxia
                </Typography>
                <Typography
                    variant="h4"
                    className={css({ "margin": theme.spacing(0, 1) })}
                >
                    - SSP Cloud
                </Typography>
                <Typography
                    variant="h4"
                    className={css({ "fontWeight": 500 })}
                    color="focus"
                >
                    Datalab
                </Typography>

            </div>

            <div className={css({
                "flex": 1,
                "display": "flex",
                "justifyContent": "flex-end",
                "alignItems": "center",
            })}>
                <IconButton
                    type="bash"
                    fontSize="large"
                    onClick={onClickFactory("cloudShell")}
                />
                <Button
                    onClick={onClickFactory("auth button")}
                    color={isUserLoggedIn ? "secondary" : "primary"}
                    className={css({ "marginLeft": theme.spacing(2) })}
                >
                    {t(isUserLoggedIn ? "logout" : "login")}
                </Button>
            </div>


        </div>
    );

});

export declare namespace Header {
    export type I18nScheme = {
        logout: undefined;
        login: undefined;
    };
}
