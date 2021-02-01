
import { useMemo, memo, useReducer } from "react";
import { Icon } from "app/components/designSystem/Icon";
import { Typography } from "app/components/designSystem/Typography";
import type { Props as IconProps } from "app/components/designSystem/Icon";
import { cx, createUseClassNames } from "app/theme/useClassNames";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "app/tools/hooks/useCallbackFactory";
import { routes } from "app/router";
import { objectKeys } from "evt/tools/typeSafety/objectKeys";

const targets = [
    "toggle isExpanded" as const,
    ...objectKeys(routes),
    "account" as const, "tour" as const, "trainings" as const, "shared services" as const,
    "catalog" as const, "my services" as const, "my files" as const, "about" as const
];

export type Target = typeof targets[number];

export type PageTarget = Exclude<Target, "toggle isExpanded">;

export type Props = {
    className?: string;
    collapsedWidth: number;
    currentPage: PageTarget;
    onClick(target: Exclude<Target, "toggle isExpanded">): void;
};

const { useClassNames } = createUseClassNames<Props>()(
    ({theme})=>({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces,
            "borderRadius": 16,
            "boxShadow": theme.custom.shadows[3],
            "paddingTop": theme.spacing(1)
        }
    })
);

export const LeftBar = memo((props: Props) => {

    const {
        collapsedWidth,
        onClick,
        className,
        currentPage
    } = props;

    const [isExpanded, toggleIsExpanded] = useReducer(value => !value, false);

    const onClickFactory = useCallbackFactory(
        ([target]: [Target]) => {

            if( target === "toggle isExpanded" ){
                toggleIsExpanded();
                return;
            }

            onClick(target)

        }
    );

    const { classNames } = useClassNames(props);

    return (
        <nav className={cx(classNames.root, className)} >
            {
                targets.map(
                    target =>
                        <CustomButton
                            key={target}
                            isActive={currentPage === target}
                            target={target}
                            isExpanded={isExpanded}
                            collapsedWidth={collapsedWidth}
                            onClick={onClickFactory(target)}
                        />
                )
            }
        </nav>
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
        isActive: boolean;
        onClick(): void;
    };

    const hoverBoxClassName = "hoverBox";

    const { useClassNames } = createUseClassNames<Props>()(
        ({ theme }, { collapsedWidth, isExpanded, target, isActive }) => ({
            "root": {
                "display": "flex",
                "cursor": "pointer",
                "marginTop": theme.spacing(1),
                [`&:hover .${hoverBoxClassName}`]: {
                    "backgroundColor": theme.custom.colors.useCases.surfaces.background,
                },
                [
                    [".MuiSvgIcon-root", ".MuiTypography-root"]
                        .map(name => `&${!isActive ? ":active" : ""} ${name}`)
                        .join(", ")
                ]: {
                    "color": theme.custom.colors.useCases.typography.textFocus
                }
            },
            "iconWrapper": {
                "width": collapsedWidth,
                "textAlign": "center",
                "position": "relative",
            },
            "iconHoverBox": {
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
                case "mySecrets": return "secrets";
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

                    <div className={cx(hoverBoxClassName, classNames.iconHoverBox)} />

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
                        <div className={cx(hoverBoxClassName, classNames.typoWrapper)} >
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
