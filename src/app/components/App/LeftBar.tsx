import { useMemo, memo } from "react";
import { Icon } from "app/theme";
import { makeStyles, Text } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { routes } from "app/routes/router";
import { doExtends } from "tsafe/doExtends";
import Divider from "@material-ui/core/Divider";
import type { IconId } from "app/theme";

const targets = [
    "toggle isExpanded" as const,
    ...(() => {
        const pageTarget = [
            "home",
            "account",
            "trainings",
            "sharedServices",
            "catalogExplorer",
            "myServices",
            "mySecrets",
            "myBuckets",
        ] as const;

        doExtends<typeof pageTarget[number], keyof typeof routes>();

        return pageTarget;
    })(),
];

export type Target = typeof targets[number];

export type Props = {
    className?: string;
    collapsedWidth: number;
    currentPage: keyof typeof routes | false;
    onClick(target: Exclude<Target, "toggle isExpanded">): void;
};

const useStyles = makeStyles<Props>()(theme => ({
    "root": {
        "paddingBottom": theme.spacing(3),
        "overflow": "visible",
    },
    "nav": {
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "borderRadius": 16,
        "boxShadow": theme.shadows[3],
        "paddingTop": theme.spacing(2),
        "overflow": "auto",
        "height": "100%",
    },
}));

const { useIsExpanded } = createUseGlobalState("isExpanded", false);

export const LeftBar = memo((props: Props) => {
    const { collapsedWidth, onClick, className, currentPage } = props;

    const { isExpanded, setIsExpanded } = useIsExpanded();

    const onClickFactory = useCallbackFactory(([target]: [Target]) => {
        if (target === "toggle isExpanded") {
            setIsExpanded(isExpanded => !isExpanded);
            return;
        }

        onClick(target);
    });

    const { classes, cx } = useStyles(props);

    return (
        <section className={cx(classes.root, className)}>
            <nav className={cx(classes.nav)}>
                {targets.map(target => (
                    <CustomButton
                        key={target}
                        isActive={
                            currentPage === target ||
                            (currentPage === "myFiles" && target === "myBuckets")
                        }
                        target={target}
                        isExpanded={isExpanded}
                        collapsedWidth={collapsedWidth}
                        hasDivider={(() => {
                            switch (target) {
                                case "account":
                                case "sharedServices":
                                case "myServices":
                                    return true;
                                default:
                                    return false;
                            }
                        })()}
                        onClick={onClickFactory(target)}
                    />
                ))}
            </nav>
        </section>
    );
});

export declare namespace LeftBar {
    export type I18nScheme = Record<Target, undefined>;
}

const { CustomButton } = (() => {
    type Props = {
        target: Exclude<Target, "toggle expand">;
        isExpanded: boolean;
        collapsedWidth: number;
        isActive: boolean;
        hasDivider: boolean;
        onClick(): void;
    };

    const hoverBoxClassName = "hoverBox";

    const useStyles = makeStyles<
        Pick<Props, "collapsedWidth" | "isExpanded" | "target" | "isActive">
    >()((theme, { collapsedWidth, isExpanded, target, isActive }) => ({
        "root": {
            "display": "flex",
            "cursor": "pointer",
            "marginTop": theme.spacing(2),
            [`&:hover .${hoverBoxClassName}`]: {
                "backgroundColor": theme.colors.useCases.surfaces.background,
            },
            [[".MuiSvgIcon-root", "h6"]
                .map(name => `&${!isActive ? ":active" : ""} ${name}`)
                .join(", ")]: {
                "color": theme.colors.useCases.typography.textFocus,
            },
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
            "left": (collapsedWidth * 1) / 8,
            "right": isExpanded ? 0 : (collapsedWidth * 1) / 8,
            "zIndex": 1,
            "borderRadius": `10px ${isExpanded ? "0 0" : "10px 10px"} 10px`,
        },
        "icon": {
            "position": "relative",
            "zIndex": 2,
            ...theme.spacing.topBottom("margin", 2),
            ...(target !== "toggle isExpanded"
                ? {}
                : {
                      "transform": isExpanded ? "rotate(0)" : "rotate(-180deg)",
                  }),
        },
        "typoWrapper": {
            "paddingRight": theme.spacing(2),
            "flex": 1,
            "borderRadius": "0 10px 10px 0",
            "display": "flex",
            "alignItems": "center",
            "marginRight": theme.spacing(5),
        },
        "divider": {
            "marginTop": theme.spacing(2),
            "borderColor": theme.colors.useCases.typography.textTertiary,
        },
    }));

    const CustomButton = memo((props: Props) => {
        const { isExpanded, target, hasDivider, onClick } = props;

        const { t } = useTranslation("LeftBar");

        const type = useMemo((): IconId => {
            switch (target) {
                case "home":
                    return "home";
                case "account":
                    return "account";
                case "catalogExplorer":
                    return "catalog";
                case "myBuckets":
                    return "files";
                case "mySecrets":
                    return "secrets";
                case "myServices":
                    return "services";
                case "sharedServices":
                    return "community";
                case "toggle isExpanded":
                    return "chevronLeft";
                case "trainings":
                    return "trainings";
            }
        }, [target]);

        const { classes, cx } = useStyles(props);

        return (
            <>
                <div className={classes.root} onClick={onClick}>
                    <div className={classes.iconWrapper}>
                        <div className={cx(hoverBoxClassName, classes.iconHoverBox)} />

                        <Icon iconId={type} className={classes.icon} size="large" />
                    </div>
                    {!isExpanded ? null : (
                        <div className={cx(hoverBoxClassName, classes.typoWrapper)}>
                            <Text typo="label 1">{t(target)}</Text>
                        </div>
                    )}
                </div>
                {hasDivider && (
                    <Divider
                        key={target + "divider"}
                        className={classes.divider}
                        variant="middle"
                    />
                )}
            </>
        );
    });

    return { CustomButton };
})();
