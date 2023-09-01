import { tss } from "ui/theme";
import { useReducer, useEffect, memo, type ReactNode } from "react";
import { useDomRect } from "onyxia-ui";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { IconButton, Icon } from "ui/theme";
import { assert } from "tsafe/assert";
import { useStateRef } from "powerhooks/useStateRef";
import { Tooltip } from "onyxia-ui/Tooltip";

export type ApiLogsBarProps = {
    className?: string;
    classes?: Partial<ReturnType<typeof useStyles>["classes"]>;
    entries: ApiLogsBarProps.Entry[];
    /** In pixel */
    maxHeight: number;
    downloadButton?: {
        tooltipTitle: NonNullable<ReactNode>;
        onClick: () => void;
    };
};

export namespace ApiLogsBarProps {
    export type Entry = {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    };
}

export const ApiLogsBar = memo((props: ApiLogsBarProps) => {
    const { className, entries, maxHeight, downloadButton } = props;

    const {
        domRect: { height: headerHeight },
        ref: headerRef
    } = useDomRect();

    const panelRef = useStateRef<HTMLDivElement>(null);

    const [{ isExpended, expendCount }, toggleIsExpended] = useReducer(
        ({ isExpended, expendCount }) => ({
            "isExpended": !isExpended,
            "expendCount": expendCount + 1
        }),
        {
            "isExpended": false,
            "expendCount": 0
        }
    );

    useEffect(() => {
        if (!isExpended) {
            return;
        }

        const panelElement = panelRef.current;

        assert(panelElement !== null);

        panelElement.scroll({
            "top": panelElement.scrollHeight,
            "behavior": "smooth"
        });
    }, [
        expendCount >= 1,
        JSON.stringify(entries.map(({ resp }) => (resp === undefined ? "x" : "o")))
    ]);

    const { cx, classes } = useStyles({
        maxHeight,
        headerHeight,
        isExpended,
        "classesOverrides": props.classes
    });

    return (
        <div
            className={cx(
                classes.root,
                isExpended ? classes.rootWhenExpended : classes.rootWhenCollapsed,
                className
            )}
        >
            <div ref={headerRef} className={classes.header}>
                <div className={classes.dollarContainer}>
                    <Icon className="dollarSign" iconId="attachMoney" size="small" />
                </div>

                <div className={classes.lastTranslatedCmd}>
                    {entries.slice(-1)[0]?.cmd.replace(/\\\n/g, " ")}
                </div>

                {downloadButton !== undefined && (
                    <Tooltip title={downloadButton.tooltipTitle}>
                        <IconButton
                            iconId="getApp"
                            className={classes.iconButton}
                            onClick={downloadButton.onClick}
                        />
                    </Tooltip>
                )}

                <IconButton
                    iconId="expandMore"
                    className={cx(classes.iconButton, classes.expandIconButton)}
                    onClick={toggleIsExpended}
                />
            </div>
            <div
                ref={panelRef}
                className={isExpended ? classes.expandedPanel : classes.collapsedPanel}
            >
                {entries.map(({ cmdId, cmd, resp }) => (
                    <div key={cmdId} className={classes.entryRoot}>
                        <div className={classes.dollarContainer}>
                            <Icon
                                iconId="attachMoney"
                                size="small"
                                className={classes.dollarIcon}
                            />
                        </div>
                        <div className={classes.preWrapper}>
                            <pre>{cmd}</pre>
                            <pre>
                                {resp === undefined ? (
                                    <CircularProgress
                                        className={classes.circularLoading}
                                        size={10}
                                    />
                                ) : (
                                    resp
                                )}
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

const useStyles = tss
    .withParams<{
        maxHeight: number;
        headerHeight: number;
        isExpended: boolean;
    }>()
    .withName({ ApiLogsBar })
    .create(({ theme, isExpended, maxHeight, headerHeight }) => {
        const borderRadius = `0 0 0 30px`;

        const textColor = theme.isDarkModeEnabled
            ? theme.colors.palette.dark.main
            : theme.colors.palette.limeGreen.main;

        return {
            "root": {
                "colorScheme": "dark"
            },
            "rootWhenExpended": {},
            "rootWhenCollapsed": {},
            "iconButton": {
                "& svg": {
                    "color": textColor,
                    "transition": theme.muiTheme.transitions.create(["transform"], {
                        "duration": theme.muiTheme.transitions.duration.short
                    })
                },
                "&:hover": {
                    "& svg": {
                        "color": theme.isDarkModeEnabled
                            ? theme.colors.palette.light.light
                            : theme.colors.palette.dark.greyVariant2
                    }
                },
                "& .MuiTouchRipple-root": {
                    "color": textColor
                }
            },
            "expandIconButton": {
                "& svg": {
                    "transform": isExpended ? "rotate(-180deg)" : "rotate(0)"
                }
            },
            "circularLoading": {
                "color": theme.colors.palette.light.main
            },
            "collapsedPanel": {
                "maxHeight": 0,
                "overflow": "hidden",
                "transform": "scaleY(0)"
            },
            "expandedPanel": {
                "maxHeight": maxHeight - headerHeight,
                "backgroundColor": theme.colors.palette.dark.light,
                "overflow": "auto",
                "transition": window.navigator.userAgent.includes("Firefox")
                    ? undefined
                    : "transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 70ms",
                "& pre": {
                    "whiteSpace": "pre-wrap",
                    "wordBreak": "break-all"
                },
                "transform": "scaleY(1)",
                "transformOrigin": "top",
                borderRadius,
                "paddingTop": theme.spacing(2),
                // Only work on Firefox when writing this
                // Note this spec isn't great, we can't specify the hover color...
                "scrollbarColor": `${theme.colors.palette.dark.greyVariant3} ${theme.colors.palette.dark.light}`,
                // shadow
                "boxShadow": theme.shadows[2]
            },
            "header": {
                "backgroundColor": theme.isDarkModeEnabled
                    ? theme.colors.palette.limeGreen.main
                    : theme.colors.palette.dark.main,
                ...(!isExpended ? {} : { borderRadius }),
                "borderRadius": `0 0 0 ${isExpended ? 0 : 30}px`,
                "transition": "border-radius 70ms ease",
                "display": "flex",
                "alignItems": "center",
                "& .dollarSign": {
                    "color": textColor
                }
            },
            "lastTranslatedCmd": {
                "flex": 1,
                "whiteSpace": "nowrap",
                "overflow": "hidden",
                "textOverflow": "ellipsis",
                "fontFamily": "monospace",
                "color": textColor,
                "marginBottom": 1
            },
            "dollarContainer": {
                "width": 70,
                "textAlign": "end",
                "paddingRight": 10
            },
            "entryRoot": {
                "display": "flex"
            },
            "preWrapper": {
                "flex": 1,
                "& pre:nth-of-type(1)": {
                    "color": theme.colors.palette.limeGreen.main,
                    "marginTop": 2
                },
                "& pre:nth-of-type(2)": {
                    "color": theme.colors.palette.light.light
                }
            },
            "dollarIcon": {
                "marginTop": 3,
                "color": theme.colors.palette.limeGreen.main
            }
        };
    });
