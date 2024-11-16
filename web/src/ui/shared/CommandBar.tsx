import { tss } from "tss";
import { memo, useState, useReducer, useEffect, type ReactNode } from "react";
import { useDomRect } from "powerhooks/useDomRect";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { assert } from "tsafe/assert";
import { useStateRef } from "powerhooks/useStateRef";
import { Tooltip } from "onyxia-ui/Tooltip";
import { Dialog } from "onyxia-ui/Dialog";
import { useConstCallback } from "powerhooks/useConstCallback";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { getIconUrlByName } from "lazy-icons";
import { useClickAway } from "powerhooks/useClickAway";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";

export type CommandBarProps = {
    className?: string;
    classes?: Partial<ReturnType<typeof useStyles>["classes"]>;
    entries: CommandBarProps.Entry[];
    /** In pixel */
    maxHeight: number;
    downloadButton?: {
        tooltipTitle: NonNullable<ReactNode>;
        onClick: () => void;
    };
    helpDialog?: {
        title?: NonNullable<ReactNode>;
        body: NonNullable<ReactNode>;
    };
    /** For controlled mode */
    isExpended?: boolean;
    onIsExpendedChange?: (isExpended: boolean) => void;
};

export namespace CommandBarProps {
    export type Entry = {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    };
}

export const CommandBar = memo((props: CommandBarProps) => {
    const {
        className,
        entries,
        maxHeight,
        downloadButton,
        helpDialog,
        isExpended: isExpended_props,
        onIsExpendedChange: onIsExpendedChange_props
    } = props;

    const {
        domRect: { height: headerHeight },
        ref: headerRef
    } = useDomRect();

    const panelRef = useStateRef<HTMLDivElement>(null);

    const { isExpended, setIsExpended } = (function useClosure() {
        const [isExpended, setIsExpended_internalState] = useState(
            isExpended_props ?? false
        );

        const setIsExpended = useConstCallback((isExpended_new: boolean) => {
            if (isExpended_new === isExpended) {
                return;
            }
            setIsExpended_internalState(isExpended_new);
            onIsExpendedChange_props?.(isExpended_new);
        });

        return { isExpended, setIsExpended };
    })();

    useEffect(() => {
        if (isExpended_props === undefined) {
            return;
        }

        setIsExpended(isExpended_props);
    }, [isExpended_props]);

    {
        const evtIsExpended = useConst(() => Evt.create<boolean>(isExpended));

        evtIsExpended.state = isExpended;

        useEvt(
            ctx =>
                evtIsExpended.attachOnce(
                    isExpended => isExpended,
                    ctx,
                    () => {
                        const panelElement = panelRef.current;

                        assert(panelElement !== null);

                        panelElement.scroll({
                            top: panelElement.scrollHeight,
                            behavior: "smooth"
                        });
                    }
                ),
            [JSON.stringify(entries.map(({ resp }) => (resp === undefined ? "x" : "o")))]
        );
    }

    const { rootRef } = (function useClosure() {
        const [trigger, pullTrigger] = useReducer(() => ({}), {});

        const { ref: rootRef } = useClickAway({
            onClickAway: () => {
                if (!isExpended) {
                    return;
                }

                pullTrigger();
            }
        });

        useEffectOnValueChange(() => {
            if (isExpended_props === undefined) {
                setIsExpended(false);
                return;
            }

            let isActive = true;

            setTimeout(() => {
                if (!isActive) {
                    return;
                }

                setIsExpended(false);
            }, 300);

            return () => {
                isActive = false;
            };
        }, [trigger]);

        return { rootRef };
    })();

    const { cx, classes } = useStyles({
        maxHeight,
        headerHeight,
        isExpended,
        classesOverrides: props.classes
    });

    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

    const onHelpDialogClose = useConstCallback(() => setIsHelpDialogOpen(false));

    const { t } = useTranslation({ CommandBar });

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsExpended(false);
            }
        };

        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    return (
        <>
            <div
                ref={rootRef}
                className={cx(
                    classes.root,
                    isExpended ? classes.rootWhenExpended : classes.rootWhenCollapsed,
                    className
                )}
            >
                <div ref={headerRef} className={classes.header}>
                    <div className={classes.dollarContainer}>
                        <Icon
                            className="dollarSign"
                            icon={getIconUrlByName("AttachMoney")}
                            size="small"
                        />
                    </div>

                    <div className={classes.lastTranslatedCmd}>
                        {entries.slice(-1)[0]?.cmd.replace(/\\\n/g, " ")}
                    </div>

                    {helpDialog !== undefined && (
                        <IconButton
                            icon={getIconUrlByName("Help")}
                            className={classes.iconButton}
                            onClick={() => setIsHelpDialogOpen(true)}
                        />
                    )}

                    {downloadButton !== undefined && (
                        <Tooltip title={downloadButton.tooltipTitle}>
                            <IconButton
                                icon={getIconUrlByName("GetApp")}
                                className={classes.iconButton}
                                onClick={downloadButton.onClick}
                            />
                        </Tooltip>
                    )}

                    <IconButton
                        icon={getIconUrlByName("ExpandMore")}
                        className={cx(classes.iconButton, classes.expandIconButton)}
                        onClick={() => setIsExpended(!isExpended)}
                    />
                </div>
                <div
                    ref={panelRef}
                    className={
                        isExpended ? classes.expandedPanel : classes.collapsedPanel
                    }
                >
                    {entries.map(({ cmdId, cmd, resp }) => (
                        <div key={cmdId} className={classes.entryRoot}>
                            <div className={classes.dollarContainer}>
                                <Icon
                                    icon={getIconUrlByName("AttachMoney")}
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
            {helpDialog !== undefined && (
                <Dialog
                    maxWidth="md"
                    classes={{
                        root: classes.helpDialog
                    }}
                    title={helpDialog.title}
                    body={helpDialog.body}
                    buttons={<Button onClick={onHelpDialogClose}>{t("ok")}</Button>}
                    isOpen={isHelpDialogOpen}
                    onClose={onHelpDialogClose}
                />
            )}
        </>
    );
});

const { i18n } = declareComponentKeys<"ok">()({ CommandBar });
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<{
        maxHeight: number;
        headerHeight: number;
        isExpended: boolean;
    }>()
    .withName({ CommandBar })
    .create(({ theme, isExpended, maxHeight, headerHeight }) => {
        const borderRadius = `0 0 0 30px`;

        const textColor = theme.isDarkModeEnabled
            ? theme.colors.palette.dark.main
            : theme.colors.palette.limeGreen.main;

        return {
            root: {
                colorScheme: "dark"
            },
            rootWhenExpended: {},
            rootWhenCollapsed: {},
            iconButton: {
                "& svg": {
                    color: textColor,
                    transition: theme.muiTheme.transitions.create(["transform"], {
                        duration: theme.muiTheme.transitions.duration.short
                    })
                },
                "&:hover": {
                    "& svg": {
                        color: theme.isDarkModeEnabled
                            ? theme.colors.palette.light.light
                            : theme.colors.palette.dark.greyVariant2
                    }
                },
                "& .MuiTouchRipple-root": {
                    color: textColor
                }
            },
            expandIconButton: {
                "& svg": {
                    transform: isExpended ? "rotate(-180deg)" : "rotate(0)"
                }
            },
            circularLoading: {
                color: theme.colors.palette.light.main
            },
            collapsedPanel: {
                maxHeight: 0,
                overflow: "hidden",
                transform: "scaleY(0)"
            },
            expandedPanel: {
                maxHeight: maxHeight - headerHeight,
                backgroundColor: theme.colors.palette.dark.light,
                overflow: "auto",
                transition: window.navigator.userAgent.includes("Firefox")
                    ? undefined
                    : "transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 70ms",
                "& pre": {
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all"
                },
                transform: "scaleY(1)",
                transformOrigin: "top",
                borderRadius,
                paddingTop: theme.spacing(2),
                // Only work on Firefox when writing this
                // Note this spec isn't great, we can't specify the hover color...
                scrollbarColor: `${theme.colors.palette.dark.greyVariant3} ${theme.colors.palette.dark.light}`,
                // shadow
                boxShadow: theme.shadows[2]
            },
            header: {
                backgroundColor: theme.isDarkModeEnabled
                    ? theme.colors.palette.limeGreen.main
                    : theme.colors.palette.dark.main,
                ...(!isExpended ? {} : { borderRadius }),
                borderRadius: `0 0 0 ${isExpended ? 0 : 30}px`,
                transition: "border-radius 70ms ease",
                display: "flex",
                alignItems: "center",
                "& .dollarSign": {
                    color: textColor
                }
            },
            lastTranslatedCmd: {
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "monospace",
                color: textColor,
                marginBottom: 1
            },
            dollarContainer: {
                width: 70,
                textAlign: "end",
                paddingRight: 10
            },
            entryRoot: {
                display: "flex"
            },
            preWrapper: {
                flex: 1,
                "& pre:nth-of-type(1)": {
                    color: theme.colors.palette.limeGreen.main,
                    marginTop: 2
                },
                "& pre:nth-of-type(2)": {
                    color: theme.colors.palette.light.light
                }
            },
            dollarIcon: {
                marginTop: 3,
                color: theme.colors.palette.limeGreen.main
            },
            helpDialog: {}
        };
    });
