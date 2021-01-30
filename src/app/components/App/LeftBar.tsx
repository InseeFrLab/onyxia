
import { useMemo, memo } from "react";
import { Icon } from "app/components/designSystem/Icon";
import { Typography } from "app/components/designSystem/Typography";
import type { Props as IconProps } from "app/components/designSystem/Icon";
import { cx, createUseClassNames } from "app/theme/useClassNames";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "app/tools/hooks/useCallbackFactory";

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

    const { useClassNames } = createUseClassNames<Props>()(
        ({ theme }, { collapsedWidth, isExpanded, target }) => ({
            "root": {
                "display": "flex",
                "cursor": "pointer",
                "marginTop": theme.spacing(1),
                "&:hover .hoverBox": {
                    "backgroundColor": theme.custom.colors.useCases.surfaces.background,
                }
            },
            "iconWrapper": {
                "width": collapsedWidth,
                "textAlign": "center",
                "position": "relative",
            },
            "hoverBox": {
                "display": "inline-block",
                "position": "absolute",
                "height": "100%",
                "left": collapsedWidth * 1 / 8,
                "right": isExpanded ? 0 : collapsedWidth * 1 / 8,
                "zIndex": 1,
                "borderRadius": `10px ${isExpanded ? "0 0" : "10px 10px"} 10px`,
            },
            "icon": {
                "position": "relative",
                "zIndex": 2,
                "margin": theme.spacing(1, 0),
                ...(target !== "toggle isExpanded" ? {} : {
                    "transform": isExpanded ? "rotate(0)" : "rotate(-180deg)"
                })

            },
            "typoWrapper": {
                "paddingRight": theme.spacing(1),
                "flex": 1,
                "borderRadius": "0 10px 10px 0",
                "display": "flex",
                "alignItems": "center",
                "marginRight": theme.spacing(2)
            }

        })
    );

    const CustomButton = memo((props: Props) => {

        const { isExpanded, target, onClick } = props;

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

        const { classNames } = useClassNames(props);

        return (
            <div
                className={classNames.root}
                onClick={onClick}
            >
                <div className={classNames.iconWrapper} >

                    <div className={cx("hoverBox", classNames.hoverBox)} />

                    <Icon
                        type={type}
                        className={classNames.icon}
                        fontSize="large"
                    />

                </div>
                {
                    !isExpanded ?
                        null
                        :
                        <div className={cx("hoverBox", classNames.typoWrapper)} >
                            <Typography variant="h6">
                                {t(target)}
                            </Typography>
                        </div>

                }
            </div>
        );

    });

    return { CustomButton };

})();
