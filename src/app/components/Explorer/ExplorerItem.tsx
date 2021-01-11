
import React, { useState, useEffect, useCallback } from "react";
import { Input } from "app/components/designSystem/textField/Input";
import type { InputProps } from "app/components/designSystem/textField/Input";
import Box from "@material-ui/core/Box";
import { Typography } from "../designSystem/Typography"
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { useClick } from "app/utils/hooks/useClick";
import Color from "color";
import { useTranslation } from "app/i18n/useTranslations";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { useValueChangeEffect } from "app/utils/hooks/useValueChangeEffect";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { smartTrim } from "app/utils/smartTrim";
import { withProps } from "app/utils/withProps";
import { useSemanticGuaranteeMemo } from "evt/tools/hooks/useSemanticGuaranteeMemo";
import { FileOrDirectoryIcon } from "./FileOrDirectoryIcon";


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
    theme => createStyles<"root" | "frame" | "text" | "hiddenSpan" | "input", Props>({
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


            })()
        }),
        "hiddenSpan": {
            "width": 0,
            "overflow": "hidden",
            "display": "inline-block"
        },
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

    const Icon = useSemanticGuaranteeMemo(
        () => withProps(
            FileOrDirectoryIcon,
            { visualRepresentationOfAFile }
        ),
        [visualRepresentationOfAFile]
    );

    const { t } = useTranslation("ExplorerItem");

    const classes = useStyles(props);

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

    //TODO: We need a custom hook for this.
    const [evtIsCircularProgressShown] = useState(() => Evt.create(isCircularProgressShown));
    useEffect(() => { evtIsCircularProgressShown.state = isCircularProgressShown });

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


    const getIsValidValue = useCallback(
        (value: string) =>
            getIsValidBasename({ "basename": value }) ?
                { "isValidValue": true } as const :
                { "isValidValue": false, "message": "" } as const,
        [getIsValidBasename]
    );

    const [evtInputAction] = useState(() => Evt.create<UnpackEvt<InputProps["evtAction"]>>());

    const onInputSubmit = useCallback(
        ({ value, isValidValue }: Parameters<InputProps["onSubmit"]>[0]) => {

            if (!isValidValue) {
                return;
            }

            setIsInEditingState(false);

            if (value === basename) {
                return;
            }

            onEditBasename({ "editedBasename": value });
        },
        [basename, onEditBasename]
    );

    const onEscapeKeyDown = useCallback(
        () => setIsInEditingState(false),
        []
    );

    const onEnterKeyDown = useCallback(
        () => evtInputAction.post("TRIGGER SUBMIT"),
        [evtInputAction]
    );

    return (
        <div className={classes.root}>
            <Box
                className={classes.frame}
                px="6px"
                py="4px"
                {...getOnMouseProps("icon")}
            >
                <Icon
                    {...{
                        standardizedWidth,
                        kind
                    }}
                />
            </Box>
            {
                !isInEditingState && !isCircularProgressShown ?
                    <Box {...getOnMouseProps("text")}>
                        {/* TODO: Something better like https://stackoverflow.com/a/64763506/3731798 */}
                        <Typography
                            className={classes.text}
                            style={{ "wordBreak": /[_\- ]/.test(basename) ? undefined : "break-all" }}
                        >{
                                smartTrim({
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
                                })
                                    //NOTE: Word break with - or space but not _, 
                                    //see: https://stackoverflow.com/a/29541502/3731798
                                    .split("_")
                                    .reduce<React.ReactNode[]>(
                                        (prev, curr, i) => [
                                            ...prev,
                                            ...(
                                                prev.length === 0 ?
                                                    [] :
                                                    ["_", <span key={i} className={classes.hiddenSpan}> </span>]
                                            ),
                                            curr
                                        ],
                                        []
                                    )
                            }</Typography>
                    </Box>
                    :
                    <form className={classes.root} noValidate autoComplete="off">
                        <Input
                            className={classes.input}
                            defaultValue={basename}
                            inputProps={{ "aria-label": t("description") }}
                            autoFocus={true}
                            color="secondary"
                            disabled={isCircularProgressShown}
                            isCircularProgressShown={isCircularProgressShown}
                            multiline={true}
                            onEscapeKeyDown={onEscapeKeyDown}
                            onEnterKeyDown={onEnterKeyDown}
                            onBlur={onEnterKeyDown}
                            evtAction={evtInputAction}
                            onSubmit={onInputSubmit}
                            getIsValidValue={getIsValidValue}
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


