


import type { ReactNode } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import { useState } from "react";
//import { useCallbackFactory } from "powerhooks";
import { Icon } from "app/components/designSystem/Icon";
import { cx, css } from "tss-react";
import { useEffectOnValueChange } from "powerhooks";
import { Typography } from "app/components/designSystem/Typography";
import { useWithProps } from "powerhooks";


export type Tab = {
    id: string;
    title: string;
};

export type Props<T extends Tab = Tab> = {
    size?: "big" | "small";
    className?: string;
    defaultSelectedTabId?: T["id"];
    tabs: T[];
    maxTabCount: number;
    onActiveTab(tabId: T["id"]): void;
};

/*
type MyProps = Props<{ id: "r", "title": "R" }|{ id: "kub", "title": "Kubernetes" }>

const onActiveTab: MyProps["onActiveTab"] = (tab)=> {
    const id = tab.id
};
*/

const { useClassNames } = createUseClassNames<Props>()(
    theme => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces,
            "boxShadow": theme.custom.shadows[1],
            "borderRadius": "8px 0 0 8px",
            "display": "flex"
        },
        "tab": {
            "flex": 1
        }
    })
);

export function AccountTabs<T extends Tab = Tab>(props: Props<T>) {

    const {
        className,
        onActiveTab,
        tabs,
        defaultSelectedTabId = tabs[0].id,
        maxTabCount,
        size = "big"
    } = props;

    const { classNames } = useClassNames(props);

    const areArrowsVisible = tabs.length > maxTabCount;


    const [firstTabIndex, setFirstTabIndex] = useState(0);

    const [selectedTabId, setSelectedTabId] = useState(defaultSelectedTabId);

    useEffectOnValueChange(
        () => { setSelectedTabId(defaultSelectedTabId); },
        [defaultSelectedTabId]
    );

    const Button = useWithProps(CustomButton, { size });

    return (
        <div className={cx(classNames.root, className)}>
            {
                areArrowsVisible &&
                <Button
                    isFirst={false}
                    className={css({ "zIndex": 0 })}
                    isDisabled={firstTabIndex === 0}
                    isSelected={false}
                    onClick={() => setFirstTabIndex(firstTabIndex - 1)}
                >
                    <Icon type="chevronLeft" />
                </Button>
            }
            <>
                {
                    tabs
                        .filter((...[, i]) => i >= firstTabIndex && i < firstTabIndex + maxTabCount)
                        .map(({ id, title }, i) => {

                            const isSelected = id === selectedTabId;

                            return (
                                <Button
                                    isDisabled={false}
                                    isFirst={i === 0}
                                    className={cx(classNames.tab, css({ "zIndex": isSelected ? maxTabCount + 1 : maxTabCount - i }))}
                                    key={id}
                                    onClick={() => {
                                        setSelectedTabId(id);
                                        onActiveTab(id);
                                    }}
                                    isSelected={isSelected}
                                >
                                    {title}
                                </Button>
                            );

                        })
                }
            </>
            {
                areArrowsVisible &&
                <Button
                    isFirst={false}
                    className={css({ "zIndex": 0 })}
                    isDisabled={firstTabIndex + maxTabCount === tabs.length - 1}
                    isSelected={false}
                    onClick={() => setFirstTabIndex(firstTabIndex + 1)}
                >
                    <Icon className={css({ "transform": "rotate(180deg)" })} type="chevronLeft" />
                </Button>
            }
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
        children: ReactNode;
    };

    const { useClassNames } = createUseClassNames<CustomButtonProps>()(
        (theme, { isSelected, isFirst, size }) => ({
            "root": {
                "backgroundColor": (() => {

                    if (isSelected) {
                        return theme.custom.colors.useCases.surfaces.surfaces;
                    }
                    return theme.custom.colors.useCases.buttons.actionSelected;

                })(),
                "boxShadow": [theme.custom.shadows[4], ...((isSelected || isFirst) ? [theme.custom.shadows[5]] : [])].join(", "),
                "padding": (()=>{
                    switch(size){
                        case "big": return theme.spacing(3, 2);
                        case "small": return theme.spacing(1, 2);
                    }
                })(),
                "display": "flex",
                "alignItems": "center",
                "cursor": "pointer",
            },
            "typo": {
                "fontWeight": isSelected ? 600 : undefined
            }
        })
    );

    function CustomButton(props: CustomButtonProps) {

        const { onClick, children, className, isDisabled, size } = props;

        const { classNames } = useClassNames(props);

        console.log(isDisabled);

        return (
            <div
                className={cx(classNames.root, className)}
                color="secondary"
                onClick={onClick}
            >
                {
                    (() => {
                        if (typeof children !== "string") {
                            return children;
                        }
                        switch (size) {
                            case "big": return <Typography variant="h6" className={classNames.typo}>
                                {/* TODO: Put text in label props or address the problem globally, see the todo in page header */}
                                {children}
                            </Typography>
                            case "small": return <Typography variant="body1" className={cx(css({ "marginTop": 2 }), classNames.typo)}>
                                {/* TODO: Put text in label props or address the problem globally, see the todo in page header */}
                                {children}
                            </Typography>
                        }
                    })()
                }

            </div>
        );

    }

    return { CustomButton };


})();

