import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { useState, useEffect, useMemo, memo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { useClick } from "powerhooks/useClick";
import Color from "color";
import { useTranslation } from "ui/i18n";
import { Evt } from "evt";
import { smartTrim } from "ui/tools/smartTrim";
import { ExplorerIcon } from "../ExplorerIcon";
import { declareComponentKeys } from "i18nifty";

export type ExplorerItemProps = {
    className?: string;

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

    /** Name displayed under the folder icon*/
    basename: string;

    /** Represent if the item is currently selected */
    isSelected: boolean;

    isCircularProgressShown: boolean;

    getIsValidBasename: (params: { basename: string }) => boolean;

    /**
     * Invoked when the component have been clicked once
     * and when it has been double clicked
     */
    onMouseEvent: (params: { type: "down" | "double"; target: "icon" | "text" }) => void;
};

export const ExplorerItem = memo((props: ExplorerItemProps) => {
    const {
        className,
        kind,
        basename,
        isCircularProgressShown,
        isSelected,
        getIsValidBasename,
        onMouseEvent
    } = props;

    const { t } = useTranslation({ ExplorerItem });

    const { classes, cx } = useStyles({ isSelected, basename });

    const [isInEditingState, setIsInEditingState] = useState(false);

    const { getOnMouseProps } = useClick<"icon" | "text">({
        "doubleClickDelayMs": 500,
        "callback": ({ type, extraArg: target }) => onMouseEvent({ type, target })
    });

    //TODO: We need a custom hook for this.
    const [evtIsCircularProgressShown] = useState(() =>
        Evt.create(isCircularProgressShown)
    );
    useEffect(() => {
        evtIsCircularProgressShown.state = isCircularProgressShown;
    });

    const getIsValidValue = useConstCallback((value: string) =>
        getIsValidBasename({ "basename": value })
            ? ({ "isValidValue": true } as const)
            : ({ "isValidValue": false, "message": "" } as const)
    );

    const [evtInputAction] = useState(() => Evt.create<TextFieldProps["evtAction"]>());

    const onInputSubmit = useConstCallback<TextFieldProps["onSubmit"]>(() => {
        setIsInEditingState(false);
    });

    const onEscapeKeyDown = useConstCallback(() => setIsInEditingState(false));

    const onEnterKeyDown = useConstCallback(() => evtInputAction.post("TRIGGER SUBMIT"));

    const formattedBasename = useMemo(
        () =>
            smartTrim({
                "text": basename,
                "maxLength": 21,
                "minCharAtTheEnd": 5
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
                                  </span>
                              ]),
                        curr
                    ],
                    []
                ),

        [basename, classes.hiddenSpan]
    );

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.frame} {...getOnMouseProps("icon")}>
                <ExplorerIcon
                    className={classes.explorerIcon}
                    iconId={(() => {
                        switch (kind) {
                            case "directory":
                                return "directory";
                            case "file":
                                return "data";
                        }
                    })()}
                    hasShadow={true}
                />
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
                        doRenderAsTextArea={true}
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

export const { i18n } = declareComponentKeys<"description">()({ ExplorerItem });

const useStyles = tss
    .withName({ ExplorerItem })
    .withParams<Pick<ExplorerItemProps, "isSelected" | "basename">>()
    .create(({ theme, isSelected, basename }) => ({
        "root": {
            "textAlign": "center",
            "cursor": "pointer",
            "width": theme.spacing(9)
        },
        "frame": {
            "borderRadius": "5px",
            "backgroundColor": isSelected ? "rgba(0, 0, 0, 0.2)" : undefined,
            "display": "inline-block",
            "padding": theme.muiTheme.spacing(2, 2)
        },
        "explorerIcon": {
            "height": 60
        },
        "text": {
            //"color": theme.palette.text[isSelected ? "primary" : "secondary"]
            //"color": !isSelected ? "rgba(0, 0, 0, 0.62)" : undefined
            "color": (() => {
                const color = new Color(
                    theme.colors.useCases.typography.textPrimary
                ).rgb();

                return color
                    .alpha((color as any).valpha * (isSelected ? 1.2 : 0.8))
                    .string();
            })(),
            "wordBreak": /[_\- ]/.test(basename) ? undefined : "break-all"
        },
        "hiddenSpan": {
            "width": 0,
            "overflow": "hidden",
            "display": "inline-block"
        },
        "input": {
            //NOTE: So that the text does not move when editing start.
            //"marginTop": "2px",
            "marginTop": "-1px",

            "paddingTop": 0,
            "& .MuiInput-input": {
                "textAlign": "center"
            }
        }
    }));
