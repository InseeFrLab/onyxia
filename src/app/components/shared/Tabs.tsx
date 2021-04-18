import { createUseClassNames } from "app/theme/useClassNames";
import { useState, memo } from "react";
import type { ReactNode } from "react";
import { Icon } from "app/components/designSystem/Icon";
import { cx, css } from "tss-react";
import { Typography } from "app/components/designSystem/Typography";
import { useCallbackFactory } from "powerhooks";


export type Props<T extends Props.Tab = Props.Tab> = {
    className?: string;
    tabs: T[];
    selectedTabId: T["id"];
    size?: "big" | "small";
    maxTabCount: number;
    onRequestChangeActiveTab(tabId: T["id"]): void;
    children: ReactNode;
};

export declare namespace Props {
    export type Tab = {
        id: string;
        title: string;
    };
}

const { useClassNames } = createUseClassNames<Props>()(
    theme => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces,
            "boxShadow": theme.custom.shadows[1],
            //"borderRadius": "8px 8px 0 0",
            "borderRadius": 8
        },
        "tabs": {
            "display": "flex",
            "overflow": "hidden"
        },
        "tab": {
            "flex": 1
        },
        "content": {
            "padding": theme.spacing(1)
        }
    })
);

export function Tabs<Tab extends Props.Tab = Props.Tab>(props: Props<Tab>) {

    const {
        className,
        tabs,
        selectedTabId,
        onRequestChangeActiveTab,
        maxTabCount,
        size = "big",
        children
    } = props;

    const { classNames } = useClassNames(props);

    const areArrowsVisible = tabs.length > maxTabCount;


    const [firstTabIndex, setFirstTabIndex] = useState(0);

    const onArrowClickFactory = useCallbackFactory(
        ([direction]: ["left" | "right"]) =>
            setFirstTabIndex(firstTabIndex + (() => {
                switch (direction) {
                    case "left": return -1;
                    case "right": return +1;
                }
            })())
    );

    const onTabClickFactory = useCallbackFactory(
        ([id]: [string]) => onRequestChangeActiveTab(id)
    );

    return (
        <div className={cx(classNames.root, className)}>

            <div className={classNames.tabs}>
                {
                    areArrowsVisible &&
                    <CustomButton
                        type="arrow"
                        direction="left"
                        size={size}
                        isFirst={false}
                        className={css({ "zIndex": 0 })}
                        isDisabled={firstTabIndex === 0}
                        isSelected={false}
                        onClick={onArrowClickFactory("left")}
                    />
                }
                <>
                    {
                        tabs
                            .filter((...[, i]) => i >= firstTabIndex && i < firstTabIndex + maxTabCount)
                            .map(({ id, ...rest }) => ({ id, "isSelected": id === selectedTabId, ...rest }))
                            .map(({ id, title, isSelected }, i) =>
                                <CustomButton
                                    type="tab"
                                    text={title}
                                    size={size}
                                    isDisabled={false}
                                    isFirst={i === 0}
                                    className={cx(classNames.tab, css({ "zIndex": isSelected ? maxTabCount + 1 : maxTabCount - i }))}
                                    key={id}
                                    onClick={onTabClickFactory(id)}
                                    isSelected={isSelected}
                                />
                            )
                    }
                </>
                {
                    areArrowsVisible &&
                    <CustomButton
                        type="arrow"
                        direction="right"
                        size={size}
                        isFirst={false}
                        className={css({ "zIndex": 0 })}
                        isDisabled={tabs.length - firstTabIndex === maxTabCount}
                        isSelected={false}
                        onClick={onArrowClickFactory("right")}
                    />
                }
            </div>

            <div className={classNames.content}>
                {children}
            </div>

        </div>
    );

}

const { CustomButton } = (() => {

    type CustomButtonProps = {
        size: "big" | "small";
        className?: string;
        isDisabled: boolean;
        isSelected: boolean;
        isFirst: boolean;
        onClick(): void;
    } & ({
        type: "arrow";
        direction: "left" | "right"
    } | {
        type: "tab";
        text: string;
    });

    const { useClassNames } = createUseClassNames<CustomButtonProps>()(
        (theme, { isSelected, isFirst, size, isDisabled }) => ({
            "root": {
                "backgroundColor": (() => {

                    if (isSelected) {
                        return theme.custom.colors.useCases.surfaces.surfaces;
                    }

                    if (isDisabled) {
                        return theme.custom.colors.useCases.buttons.actionDisabledBackground;
                    }

                    return theme.custom.colors.useCases.buttons.actionSelected;

                })(),
                "boxShadow": [theme.custom.shadows[4], ...((isSelected || isFirst) ? [theme.custom.shadows[5]] : [])].join(", "),
                "padding": (() => {
                    switch (size) {
                        case "big": return theme.spacing(3, 2);
                        case "small": return theme.spacing(1, 2);
                    }
                })(),
                "display": "flex",
                "alignItems": "center",
                "cursor": !isDisabled ? "pointer" : "default",
            },
            "typo": {
                "fontWeight": isSelected ? 600 : undefined
            }
        })
    );

    const CustomButton = memo((props: CustomButtonProps) => {

        const { onClick, className, size, isDisabled } = props;

        const { classNames } = useClassNames(props);

        return (
            <div
                className={cx(classNames.root, className)}
                color="secondary"
                onClick={isDisabled ? undefined : onClick}
            >
                {
                    (() => {
                        switch (props.type) {
                            case "arrow": return (
                                <Icon
                                    className={(() => {
                                        switch (props.direction) {
                                            case "right": return css({ "transform": "rotate(180deg)" });
                                            case "left": return undefined;
                                        }
                                    })()}
                                    type="chevronLeft"
                                />
                            );
                            case "tab": return (
                                <Typography
                                    variant={(() => {
                                        switch (size) {
                                            case "big": return "h6";
                                            case "small": return "body1";
                                        }
                                    })()}
                                    className={cx(
                                        css({ "marginTop": 2 }), //TODO: address globally
                                        classNames.typo
                                    )}
                                >
                                    {props.text}
                                </Typography>
                            );
                        }
                    })()
                }
            </div>
        );

    });

    return { CustomButton };


})();

