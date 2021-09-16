import { makeStyles } from "app/theme";
import { useReducer, useRef, useEffect, memo } from "react";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks/useEvt";
import { useDomRect } from "onyxia-ui";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { IconButton } from "app/theme";
import { Icon } from "app/theme";
import { assert } from "tsafe/assert";

export type Props = {
    className: string;
    translations: {
        evt: NonPostableEvt<{
            type: "cmd" | "result";
            cmdId: number;
            translation: string;
        }>;
        history: readonly {
            cmdId: number;
            cmd: string;
            resp: string | undefined;
        }[];
    };
    /** In pixel */
    maxHeight: number;
};

const useStyles = makeStyles<Props & { headerHeight: number; isExpended: boolean }>()(
    (theme, { isExpended, maxHeight, headerHeight }) => {
        const borderRadius = `0 0 0 30px`;

        const textColor = theme.isDarkModeEnabled
            ? theme.colors.palette.dark.main
            : theme.colors.palette.limeGreen.main;

        return {
            "iconButton": {
                "& svg": {
                    "color": textColor,
                    "transition": theme.muiTheme.transitions.create(["transform"], {
                        "duration": theme.muiTheme.transitions.duration.short,
                    }),
                    "transform": isExpended ? "rotate(-180deg)" : "rotate(0)",
                },
                "&:hover": {
                    "& svg": {
                        "color": theme.isDarkModeEnabled
                            ? theme.colors.palette.light.light
                            : theme.colors.palette.dark.greyVariant2,
                    },
                },
                "& .MuiTouchRipple-root": {
                    "color": textColor,
                },
            },
            "circularLoading": {
                "color": theme.colors.palette.light.main,
            },
            "collapsedPanel": {
                "maxHeight": 0,
                "overflow": "hidden",
                "transform": "scaleY(0)",
                "transition": "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            },
            "expandedPanel": {
                "maxHeight": maxHeight - headerHeight,
                "backgroundColor": theme.colors.palette.dark.light,
                "overflow": "auto",
                "transition": "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "& pre": {
                    "whiteSpace": "pre-wrap",
                    "wordBreak": "break-all",
                },
                "transform": "scaleY(1)",
                "transformOrigin": "top",
                borderRadius,
                "paddingTop": theme.spacing(2),
            },
            "header": {
                "backgroundColor": theme.isDarkModeEnabled
                    ? theme.colors.palette.limeGreen.main
                    : theme.colors.palette.dark.main,
                ...(!isExpended ? {} : { borderRadius }),
                "borderRadius": `0 0 0 ${isExpended ? 0 : 30}px`,
                "display": "flex",
                "alignItems": "center",
                //"border": "1px solid white"
                "& .dollarSign": {
                    "color": textColor,
                },
            },
            "lastTranslatedCmd": {
                "flex": 1,
                "whiteSpace": "nowrap",
                "overflow": "hidden",
                "textOverflow": "ellipsis",
                "fontFamily": "monospace",
                //"border": "1px solid white",
                "color": textColor,
            },
            "dollarContainer": {
                "width": 70,
                //"border": "1px solid white",
                "textAlign": "end",
                "paddingRight": 10,
            },
            "entryRoot": {
                "display": "flex",
                //"border": "1px solid white"
            },
            "preWrapper": {
                "flex": 1,
                "& pre:nth-of-type(1)": {
                    "color": theme.colors.palette.limeGreen.main,
                    "marginTop": 2,
                },
                "& pre:nth-of-type(2)": {
                    "color": theme.colors.palette.light.light,
                },
            },
            "dollarIcon": {
                "color": theme.colors.palette.limeGreen.main,
            },
        };
    },
);
export const CmdTranslation = memo((props: Props) => {
    const { className, translations } = props;

    useEvt(
        (ctx, registerSideEffect) =>
            translations.evt.attach(ctx, () =>
                registerSideEffect(() => {
                    //This will trigger an update,
                    //translations.history will have changed.
                    //console.log(JSON.stringify(translations.history[translations.history.length -1], null, 2));
                }),
            ),
        [translations.evt],
    );

    const {
        domRect: { height: headerHeight },
        ref: headerRef,
    } = useDomRect();

    const panelRef = useRef<HTMLDivElement>(null);

    const [isExpended, toggleIsExpended] = useReducer(isExpended => !isExpended, false);

    useEffect(() => {
        if (!isExpended) {
            return;
        }

        const { current: element } = panelRef!;

        assert(element !== null);

        element.scroll({
            "top": element.scrollHeight,
            "behavior": "smooth",
        });
    }, [isExpended, translations.evt.postCount]);

    //TODO: see if classes are recomputed every time because ref object changes
    const { classes } = useStyles({ ...props, headerHeight, isExpended });

    return (
        <div className={className}>
            <div ref={headerRef} className={classes.header}>
                <div className={classes.dollarContainer}>
                    <Icon className="dollarSign" iconId="attachMoney" size="small" />
                </div>

                <div className={classes.lastTranslatedCmd}>
                    {translations.history.slice(-1)[0]?.cmd.replace(/\\\n/g, " ")}
                </div>

                <IconButton
                    iconId="expandMore"
                    className={classes.iconButton}
                    onClick={toggleIsExpended}
                />
            </div>
            <div
                ref={panelRef}
                className={isExpended ? classes.expandedPanel : classes.collapsedPanel}
            >
                {translations.history.map(({ cmdId, cmd, resp }) => (
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
