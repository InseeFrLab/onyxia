
import { useMemo, memo } from "react";
import { Icon } from "app/components/designSystem/Icon";
import { Typography } from "app/components/designSystem/Typography";
import type { Props as IconProps } from "app/components/designSystem/Icon";
import { css, cx, useTheme } from "app/theme/useClassNames";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "app/utils/hooks/useCallbackFactory";

const targets = [
    "toggle isExpanded",
    "home", "account", "tour", "trainings", "shared services",
    "catalog", "my services", "my files", "my secrets", "about"
] as const;

export type Target = typeof targets[number];

export type Props = {
    className?: string;
    isExpanded: boolean;
    onClick(target: Target): void;
    collapsedWidth: number;
};


export const LeftBar = memo((props: Props) => {

    const {
        isExpanded,
        collapsedWidth,
        onClick,
        className
    } = props;

    const onClickFactory = useCallbackFactory(
        ([target]: Parameters<Props["onClick"]>) => onClick(target),
        [onClick]
    );

    return (
        <div className={className} >
            {
                targets.map(
                    target =>
                        <CustomButton
                            key={target}
                            target={target}
                            isExpanded={isExpanded}
                            collapsedWidth={collapsedWidth}
                            onClick={onClickFactory(target)}
                        />
                )
            }


        </div>
    );

});

export declare namespace LeftBar {
    export type I18nScheme = Record<
        Target,
        undefined
    >;
}

const { CustomButton } = (() => {

    type Props = {
        target: Exclude<Target, "toggle expand">;
        isExpanded: boolean;
        collapsedWidth: number;
        onClick(): void;
    };

    const CustomButton = memo((props: Props) => {

        const { isExpanded, target, collapsedWidth, onClick } = props;

        const { t } = useTranslation("LeftBar");

        const type = useMemo((): IconProps["type"] => {
            switch (target) {
                case "home": return "home";
                case "account": return "account";
                case "catalog": return "services";
                case "my files": return "files";
                case "my secrets": return "secrets";
                case "my services": return "lab";
                case "shared services": return "community";
                case "toggle isExpanded": return "chevronLeft";
                case "tour": return "tour";
                case "trainings": return "trainings";
                case "about": return "infoOutlined";
            }
        }, [target]);

        const theme = useTheme();

        return (
            <div
                className={css({
                    "display": "flex",
                    "cursor": "pointer",
                    //"border": "1px solid red",
                    "marginTop": theme.spacing(1),
                    "&:hover .hoverBox": isExpanded ? {
                        "backgroundColor": theme.custom.colors.useCases.surfaces.background,
                    } : undefined
                })}
                onClick={onClick}
            >
                <div
                    className={css({
                        "width": collapsedWidth,
                        "textAlign": "center",
                        //"border": "1px solid black",
                        "position": "relative",

                    })}
                >

                    <div
                        className={cx(
                            "hoverBox",
                            css({
                                "display": "inline-block",
                                "position": "absolute",
                                "height": "100%",
                                "left": collapsedWidth * 1 / 8,
                                "right": 0,
                                "zIndex": 1,
                                "borderRadius": "10px 0 0 10px",
                            })
                        )}
                    />

                    <Icon
                        type={type}
                        className={
                            cx(
                                target !== "toggle isExpanded" ?
                                    undefined :
                                    css({ "transform": isExpanded ? "rotate(0)" : "rotate(-180deg)" }),
                                css({ 
                                    "position": "relative", 
                                    "zIndex": 2,
                                    "margin": theme.spacing(1,0),
                                })
                            )
                        }
                        fontSize="large"
                    />

                </div>
                {
                    !isExpanded ?
                        null
                        :
                        
                        <div
                            className={cx(
                                "hoverBox",
                                css({
                                    //"border": "1px solid purple",
                                    "paddingRight": theme.spacing(1),
                                    "flex": 1,
                                    "borderRadius": "0 10px 10px 0",
                                    "display": "flex",
                                    "alignItems": "center"
                                })
                            )}
                        >

                        <Typography
                            variant="h6"
                        >
                            {t(target)}
                        </Typography>
                        </div>

                }

            </div>
        );

    });

    return { CustomButton };

})();
