import { makeStyles, Text } from "app/theme";
import { memo } from "react";
import { Icon, IconButton } from "app/theme";
import type { IconId } from "app/theme";
import { useDomRect } from "powerhooks/useDomRect";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import { id } from "tsafe/id";
import { useConstCallback } from "powerhooks/useConstCallback";

export type Props = {
    mainIcon: IconId;
    title: string;
    helpIcon?: IconId;
    helpTitle: NonNullable<React.ReactNode>;
    helpContent: NonNullable<React.ReactNode>;
    className?: string;
};

const useStyles = makeStyles<{ helperHeight: number }>()(
    (theme, { helperHeight }) => ({
        "root": {
            "backgroundColor": "inherit",
            "paddingBottom": theme.spacing(5),
        },
        "title": {
            "display": "flex",
            "alignItems": "center",
        },
        "titleIcon": {
            "marginRight": theme.spacing(3),
        },
        "helperRoot": {
            "display": "flex",
            "backgroundColor": theme.colors.useCases.surfaces.surface2,
            "alignItems": "start",
            "padding": theme.spacing(3),
            "borderRadius": helperHeight * 0.15,
            "marginTop": theme.spacing(3),
        },
        "helperMiddle": {
            "flex": 1,
        },
        "helperIcon": {
            "marginRight": theme.spacing(3),
            "color": theme.colors.useCases.typography.textFocus,
        },
        "closeButton": {
            "padding": 0,
            "marginLeft": theme.spacing(3),
        },
    }),
);

const { usePageHeaderClosedHelpers } = createUseGlobalState(
    "pageHeaderClosedHelpers",
    id<string[]>([]),
    { "persistance": false },
);

export const PageHeader = memo((props: Props) => {
    const { mainIcon, title, helpTitle, helpIcon, helpContent, className } =
        props;

    const {
        ref: helperRef,
        domRect: { height: helperHeight },
    } = useDomRect();

    const { classes, cx } = useStyles({ helperHeight });

    const { isHelpShown, hideHelp } = (function useClosure() {
        const { pageHeaderClosedHelpers, setPageHeaderClosedHelpers } =
            usePageHeaderClosedHelpers();

        const isHelpShown = !pageHeaderClosedHelpers.includes(title);

        const hideHelp = useConstCallback(() =>
            setPageHeaderClosedHelpers([...pageHeaderClosedHelpers, title]),
        );

        return { isHelpShown, hideHelp };
    })();

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="page heading" className={classes.title}>
                <Icon
                    iconId={mainIcon}
                    className={classes.titleIcon}
                    size="large"
                />
                {title}
            </Text>
            {isHelpShown && (
                <div ref={helperRef} className={classes.helperRoot}>
                    {helpIcon && (
                        <div>
                            <Icon
                                iconId={helpIcon}
                                className={classes.helperIcon}
                            />
                        </div>
                    )}
                    <div className={classes.helperMiddle}>
                        <Text typo="navigation label">{helpTitle}</Text>
                        <Text typo="body 1">{helpContent}</Text>
                    </div>
                    <div>
                        <IconButton
                            iconId="close"
                            onClick={hideHelp}
                            className={classes.closeButton}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});
