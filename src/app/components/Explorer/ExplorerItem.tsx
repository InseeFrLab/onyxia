
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ReactComponent as SecretSvg } from "app/assets/svg/Secret.svg";
import { ReactComponent as FileSvg } from "app/assets/svg/ExplorerFile.svg";
import { ReactComponent as DirectorySvg } from "app/assets/svg/Directory.svg";
import { useTheme } from "@material-ui/core/styles";
import Input from "@material-ui/core/Input";
import Box from "@material-ui/core/Box";
import { Typography } from "../designSystem/Typography"
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { CircularProgress } from "app/components/designSystem/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import { useClick } from "app/utils/hooks/useClick";
import Color from "color";
import { useTranslation } from "app/i18n/useTranslations";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import memoize from "memoizee";
import { useValueChangeEffect } from "app/utils/hooks/useValueChangeEffect";
import { Evt } from "evt";

export type Props = {
    /** [HIGHER ORDER] What visual asset should be used to represent a file */
    visualRepresentationOfAFile: "secret" | "file";

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

    /** Name displayed under the folder icon*/
    basename: string;

    /** Represent if the item is currently selected */
    isSelected: boolean;

    /** Big for large screen, normal otherwise */
    standardizedWidth: "normal" | "big";

    isCircularProgressShown: boolean;

    getIsValidBasename(params: { basename: string; }): boolean;

    /** 
     * Invoked when the component have been clicked once 
     * and when it has been double clicked 
     */
    onMouseEvent(params: { type: "down" | "double", target: "icon" | "text" }): void;

    onEditBasename(params: { editedBasename: string; }): void;

    /** Assert initial value is false */
    onIsInEditingStateValueChange(params: { isInEditingState: boolean; }): void;


    evtAction: NonPostableEvt<"ENTER EDITING STATE">;

};

const useStyles = makeStyles(
    theme => createStyles<"root" | "svg" | "frame" | "text" | "input", Props>({
        "root": {
            "textAlign": "center",
            "cursor": "pointer",
            "width": ({ standardizedWidth }) =>
                theme.spacing((() => {
                    switch (standardizedWidth) {
                        case "big": return 15;
                        case "normal": return 10;
                    }
                })())
        },
        "svg": {
            "fill": "currentColor",
            "color": ({ kind }) => {
                switch (kind) {
                    case "directory": return theme.palette.primary.main;
                    case "file": return theme.palette.secondary[(() => {
                        switch (theme.palette.type) {
                            case "light": return "main";
                            case "dark": return "contrastText";
                        }
                    })()];
                }
            },
            // https://stackoverflow.com/a/24626986/3731798
            "display": "block"
        },
        "frame": ({ isSelected }) => ({
            "borderRadius": "5px",
            "backgroundColor": isSelected ? "rgba(0, 0, 0, 0.2)" : undefined,
            "display": "inline-block"
        }),
        "text": ({ isSelected }) => ({
            //"color": theme.palette.text[isSelected ? "primary" : "secondary"]
            //"color": !isSelected ? "rgba(0, 0, 0, 0.62)" : undefined
            "color": (() => {

                const color = new Color(theme.palette.text.primary).rgb();

                return color
                    .alpha((color as any).valpha * (isSelected ? 1.2 : 0.8))
                    .string();


            })(),
            //"wordBreak": "break-all"
        }),
        "input": {
            //NOTE: So that the text does not move when editing start.
            "marginTop": "2px",
            "paddingTop": 0,
            "& .MuiInput-input": {
                "textAlign": "center"
            }
        }
    })
);

/** 
 * @protected This is exported only for storybook, use the factory instead.
 */
export function ExplorerItem(props: Props) {

    const {
        visualRepresentationOfAFile,
        kind,
        basename,
        isCircularProgressShown,
        standardizedWidth,
        evtAction,
        onMouseEvent,
        onEditBasename,
        onIsInEditingStateValueChange,
        getIsValidBasename
    } = props;

    const { t } = useTranslation("ExplorerItem");

    const theme = useTheme();

    const classes = useStyles(props);

    /* 
     * NOTE: We can't set the width and height in css ref:
     * https://css-tricks.com/scale-svg/#how-to-scale-svg-to-fit-within-a-certain-size-without-distorting-the-image
     */
    const { width, height } = useMemo(() => {

        const width = theme.spacing((() => {
            switch (standardizedWidth) {
                case "big": return 7;
                case "normal": return 5;
            }
        })());

        return { width, "height": ~~(width * 8 / 10) };

    }, [theme, standardizedWidth]);

    const SvgComponent = useMemo(() => {

        switch (kind) {
            case "directory":
                return DirectorySvg;
            case "file":
                switch (visualRepresentationOfAFile) {
                    case "file": return FileSvg;
                    case "secret": return SecretSvg;
                }
        }

    }, [kind, visualRepresentationOfAFile]);

    const [editedBasename, setEditedBasename] = useState(basename);

    useEffect(
        () => {
            setIsInputError(
                !getIsValidBasename({ "basename": editedBasename })
            );
        },
        [editedBasename, getIsValidBasename]
    );


    const [isInputError, setIsInputError] = useState(
        () => !getIsValidBasename({ "basename": editedBasename })
    );

    const onChange = useCallback(
        ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setEditedBasename(target.value),
        []
    );

    const [isInEditingState, setIsInEditingState] = useState(false);

    useValueChangeEffect(
        () => onIsInEditingStateValueChange({ isInEditingState }), 
        [isInEditingState]
    );

    const { getOnMouseProps } = useClick<"icon" | "text">({
        "doubleClickDelayMs": 500,
        "callback": useCallback(({ type, extraArg: target }) =>
            onMouseEvent({ type, target }),
            [onMouseEvent])
    });

    const onFocus = useCallback(
        ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            target.setSelectionRange(0, target.value.length),
        []
    );

    const [evtIsCircularProgressShown] = useState(() => Evt.create(isCircularProgressShown));
    useEffect(()=>{ evtIsCircularProgressShown.state = isCircularProgressShown });

    useEvt(
        ctx => evtAction
            .pipe(ctx)
            .attach(
                action => action === "ENTER EDITING STATE",
                () => evtIsCircularProgressShown.attachOnce(
                    isCircularProgressShown => !isCircularProgressShown,
                    ctx,
                    () => setIsInEditingState(true)
                )
            ),
        [evtAction, evtIsCircularProgressShown]
    );

    const leaveEditingStateFactory = useMemo(
        () => memoize((isCancel: boolean) =>
            () => {

                setIsInEditingState(false);

                if (isCancel) {
                    setEditedBasename(basename);
                    return;
                }

                if (editedBasename === basename) {
                    return;
                }

                if (isInputError) {
                    return;
                }

                onEditBasename({ editedBasename });

            }
        ),
        [editedBasename, isInputError, basename, onEditBasename]
    );

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {

            const key = (() => {
                switch (event.key) {
                    case "Escape":
                    case "Enter":
                        return event.key;
                    default: return "irrelevant";
                }
            })();

            if (key === "irrelevant") {
                return;
            }

            event.preventDefault();

            const isCancel = (() => {
                switch (key) {
                    case "Escape": return true;
                    case "Enter": return false;
                }
            })();

            leaveEditingStateFactory(isCancel)();


        },
        [leaveEditingStateFactory]
    );

    return (
        <div className={classes.root}>
            <Box
                className={classes.frame}
                px="6px"
                py="4px"
                {...getOnMouseProps("icon")}
            >
                <SvgComponent width={width} height={height} className={classes.svg} />
            </Box>
            {
                !isInEditingState && !isCircularProgressShown ?
                    <Box {...getOnMouseProps("text")}>
                        {/* TODO: Something better like https://stackoverflow.com/a/64763506/3731798 */}
                        <Typography
                            className={classes.text}
                            style={{
                                "wordBreak": /[_\- ]/.test(basename) ?
                                    undefined :
                                    "break-all"
                            }}
                        >
                            {smartTrim({
                                "text": basename,
                                ...(() => {
                                    switch (standardizedWidth) {
                                        case "big": return {
                                            "maxLength": 25,
                                            "minCharAtTheEnd": 7
                                        };
                                        case "normal": return {
                                            "maxLength": 21,
                                            "minCharAtTheEnd": 5
                                        };
                                    }
                                })()
                            })}
                        </Typography>
                    </Box>
                    :
                    <form className={classes.root} noValidate autoComplete="off">
                        <Input
                            className={classes.input}
                            defaultValue={editedBasename}
                            inputProps={{ "aria-label": t("description") }}
                            autoFocus={true}
                            color="secondary"
                            disabled={isCircularProgressShown}
                            endAdornment={
                                !isCircularProgressShown ? undefined :
                                    <InputAdornment position="end">
                                        <CircularProgress color="textPrimary" size={10} />
                                    </InputAdornment>
                            }
                            multiline={true}
                            error={isInputError}
                            onChange={onChange}
                            onFocus={onFocus}
                            onKeyDown={onKeyDown}
                            onBlur={leaveEditingStateFactory(false)}
                        />
                    </form>
            }
        </div>
    );

}

export declare namespace ExplorerItem {

    export type I18nScheme = {
        description: undefined;
    };

}

function smartTrim(params: {
    text: string;
    maxLength: number;
    minCharAtTheEnd: number;
}): string {

    const { text, maxLength, minCharAtTheEnd } = params;
    if (!text) return text;
    if (maxLength < 1) return text;
    if (text.length <= maxLength) return text;
    if (maxLength === 1) return text.substring(0, 1) + '...';

    const left = text.substr(0, text.length - minCharAtTheEnd);

    const right = text.substr(-minCharAtTheEnd);

    const maxLeft = maxLength - minCharAtTheEnd - 3;

    const croppedLeft = left.substr(0, maxLeft);

    return croppedLeft + "..." + right;

}

