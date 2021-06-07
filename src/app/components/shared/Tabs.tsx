import { createUseClassNames } from "app/theme";
import { useState, memo } from "react";
import type { ReactNode } from "react";
import { Icon } from "app/theme";
import { cx, css } from "tss-react";
import { Typography } from "onyxia-ui";
import { useCallbackFactory } from "powerhooks";


export type Props<TabId extends string = string> = {
    className?: string;
    tabs: Props.Tab<TabId>[];
    activeTabId: TabId;
    size?: "big" | "small";
    maxTabCount: number;
    onRequestChangeActiveTab(tabId: TabId): void;
    children: ReactNode;
};

export declare namespace Props {
    export type Tab<TabId extends string> = {
        id: TabId;
        title: string;
    };
}

const { useClassNames } = createUseClassNames<Props>()(
    theme => ({
        "root": {
            "backgroundColor": theme.colors.useCases.surfaces.surface1
        },
        "tabs": {
            "display": "flex",
            "overflow": "hidden"
        },
        "tab": {
            "flex": 1
        },
        "content": {
            "padding": theme.spacing(3)
        }
    })
);

export function Tabs<TabId extends string = string>(props: Props<TabId>) {

    const {
        className,
        tabs,
        activeTabId,
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
        ([id]: [TabId]) => onRequestChangeActiveTab(id)
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
                            .map(({ id, ...rest }) => ({ id, "isSelected": id === activeTabId, ...rest }))
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
                "backgroundColor": theme.colors.useCases.surfaces[isSelected ? "surface1" : "surface2"],
                "boxShadow": [theme.shadows[4], ...((isSelected || isFirst) ? [theme.shadows[5]] : [])].join(", "),
                "padding": (() => {
                    switch (size) {
                        case "big": return theme.spacing(2, 3);
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
                onMouseDown={isDisabled ? undefined : onClick}
            >
                {
                    (() => {
                        switch (props.type) {
                            case "arrow": return (
                                <Icon
                                    color={isDisabled ? "textDisabled" : undefined}
                                    className={(() => {
                                        switch (props.direction) {
                                            case "right": return css({ "transform": "rotate(180deg)" });
                                            case "left": return undefined;
                                        }
                                    })()}
                                    id="chevronLeft"
                                />
                            );
                            case "tab": return (
                                <Typography
                                    color={isDisabled ? "disabled" : undefined}
                                    variant={(() => {
                                        switch (size) {
                                            case "big": return "h6";
                                            case "small": return "body1";
                                        }
                                    })()}
                                    className={classNames.typo}
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

