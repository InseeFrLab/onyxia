import { makeStyles, Text } from "ui/theme";
import { useState, useEffect, useMemo, memo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { useClick } from "powerhooks/useClick";
import Color from "color";
import { useTranslation } from "ui/i18n/useTranslations";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { smartTrim } from "ui/tools/smartTrim";
import { FileOrDirectoryIcon } from "../FileOrDirectoryIcon";

export type ExplorerItemProps = {
    className?: string;

    /** [HIGHER ORDER] What visual asset should be used to represent a file */
    explorerType: "s3" | "secrets";

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

    /** Name displayed under the folder icon*/
    basename: string;

    /** Represent if the item is currently selected */
    isSelected: boolean;

    /** Big for large screen, normal otherwise */
    standardizedWidth: "normal" | "big";

    isCircularProgressShown: boolean;

    getIsValidBasename: (params: { basename: string }) => boolean;

    /**
     * Invoked when the component have been clicked once
     * and when it has been double clicked
     */
    onMouseEvent: (params: { type: "down" | "double"; target: "icon" | "text" }) => void;

    onEditBasename: (params: { editedBasename: string }) => void;

    /** Assert initial value is false */
    onIsInEditingStateValueChange: (params: { isInEditingState: boolean }) => void;

    evtAction: NonPostableEvt<"ENTER EDITING STATE">;
};

export const ExplorerItem = memo((props: ExplorerItemProps) => {
    const {
        className,
        explorerType,
        kind,
        basename,
        isCircularProgressShown,
        standardizedWidth,
        evtAction,
        getIsValidBasename,
        onMouseEvent,
        onEditBasename,
        onIsInEditingStateValueChange,
    } = props;

    const { t } = useTranslation({ ExplorerItem });

    const { classes, cx } = useStyles(props);

    const [isInEditingState, setIsInEditingState] = useState(false);

    useEffectOnValueChange(
        () => onIsInEditingStateValueChange({ isInEditingState }),
        [isInEditingState],
    );

    const { getOnMouseProps } = useClick<"icon" | "text">({
        "doubleClickDelayMs": 500,
        "callback": ({ type, extraArg: target }) => onMouseEvent({ type, target }),
    });

    //TODO: We need a custom hook for this.
    const [evtIsCircularProgressShown] = useState(() =>
        Evt.create(isCircularProgressShown),
    );
    useEffect(() => {
        evtIsCircularProgressShown.state = isCircularProgressShown;
    });

    useEvt(
        ctx =>
            evtAction.pipe(ctx).attach(
                action => action === "ENTER EDITING STATE",
                () =>
                    evtIsCircularProgressShown.attachOnce(
                        isCircularProgressShown => !isCircularProgressShown,
                        ctx,
                        () => setIsInEditingState(true),
                    ),
            ),
        [evtAction, evtIsCircularProgressShown],
    );

    const getIsValidValue = useConstCallback((value: string) =>
        getIsValidBasename({ "basename": value })
            ? ({ "isValidValue": true } as const)
            : ({ "isValidValue": false, "message": "" } as const),
    );

    const [evtInputAction] = useState(() =>
        Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>(),
    );

    const onInputSubmit = useConstCallback<TextFieldProps["onSubmit"]>(value => {
        setIsInEditingState(false);

        if (value === basename) {
            return;
        }

        onEditBasename({ "editedBasename": value });
    });

    const onEscapeKeyDown = useConstCallback(() => setIsInEditingState(false));

    const onEnterKeyDown = useConstCallback(() => evtInputAction.post("TRIGGER SUBMIT"));

    const formattedBasename = useMemo(
        () =>
            smartTrim({
                "text": basename,
                ...(() => {
                    switch (standardizedWidth) {
                        case "big":
                            return {
                                "maxLength": 25,
                                "minCharAtTheEnd": 7,
                            };
                        case "normal":
                            return {
                                "maxLength": 21,
                                "minCharAtTheEnd": 5,
                            };
                    }
                })(),
            })
                //NOTE: Word break with - or space but not _,
                //see: https://stackoverflow.com/a/29541502/3731798
                .split("_")
                .reduce<React.ReactNode[]>(
                    (prev, curr, i) => [
                        ...prev,
                        ...(prev.length === 0
                            ? []
                            : [
                                  "_",
                                  <span key={i} className={classes.hiddenSpan}>
                                      {" "}
                                  </span>,
                              ]),
                        curr,
                    ],
                    [],
                ),

        [basename, standardizedWidth, classes.hiddenSpan],
    );

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.frame} {...getOnMouseProps("icon")}>
                <FileOrDirectoryIcon {...{ explorerType, standardizedWidth, kind }} />
            </div>
            {!isInEditingState && !isCircularProgressShown ? (
                <div {...getOnMouseProps("text")}>
                    {/* TODO: Something better like https://stackoverflow.com/a/64763506/3731798 */}
                    <Text typo="body 1" className={classes.text}>
                        {formattedBasename}
                    </Text>
                </div>
            ) : (
                <form className={classes.root /*TODO*/} noValidate autoComplete="off">
                    <TextField
                        className={classes.input}
                        defaultValue={basename}
                        inputProps_aria-label={t("description")}
                        inputProps_autoFocus={true}
                        doOnlyValidateInputAfterFistFocusLost={false}
                        disabled={isCircularProgressShown}
                        isCircularProgressShown={isCircularProgressShown}
                        selectAllTextOnFocus={true}
                        multiline={true}
                        onEscapeKeyDown={onEscapeKeyDown}
                        onEnterKeyDown={onEnterKeyDown}
                        onBlur={onEnterKeyDown}
                        evtAction={evtInputAction}
                        onSubmit={onInputSubmit}
                        getIsValidValue={getIsValidValue}
                        inputProps_spellCheck={false}
                    />
                </form>
            )}
        </div>
    );
});
export declare namespace ExplorerItem {
    export type I18nScheme = {
        description: undefined;
    };
}

const useStyles = makeStyles<
    Pick<ExplorerItemProps, "isSelected" | "basename" | "standardizedWidth">
>({
    "name": { ExplorerItem },
})((theme, { isSelected, basename, standardizedWidth }) => ({
    "root": {
        "textAlign": "center",
        "cursor": "pointer",
        "width": theme.spacing(
            (() => {
                switch (standardizedWidth) {
                    case "normal":
                        return 7;
                    case "big":
                        return 9;
                }
            })(),
        ),
    },
    "frame": {
        "borderRadius": "5px",
        "backgroundColor": isSelected ? "rgba(0, 0, 0, 0.2)" : undefined,
        "display": "inline-block",
        "padding": theme.muiTheme.spacing("4px", "6px"),
    },
    "text": {
        //"color": theme.palette.text[isSelected ? "primary" : "secondary"]
        //"color": !isSelected ? "rgba(0, 0, 0, 0.62)" : undefined
        "color": (() => {
            const color = new Color(theme.colors.useCases.typography.textPrimary).rgb();

            return color.alpha((color as any).valpha * (isSelected ? 1.2 : 0.8)).string();
        })(),
        "wordBreak": /[_\- ]/.test(basename) ? undefined : "break-all",
    },
    "hiddenSpan": {
        "width": 0,
        "overflow": "hidden",
        "display": "inline-block",
    },
    "input": {
        //NOTE: So that the text does not move when editing start.
        //"marginTop": "2px",
        "marginTop": "-1px",

        "paddingTop": 0,
        "& .MuiInput-input": {
            "textAlign": "center",
        },
    },
}));
