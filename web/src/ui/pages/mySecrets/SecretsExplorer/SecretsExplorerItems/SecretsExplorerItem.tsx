import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { useState, useEffect, useMemo, memo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { useClick } from "powerhooks/useClick";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "ui/i18n";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { smartTrim } from "ui/tools/smartTrim";
import { ExplorerIcon } from "../ExplorerIcon";
import { declareComponentKeys } from "i18nifty";

export type SecretsExplorerItemProps = {
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

    onEditBasename: (params: { editedBasename: string }) => void;

    /** Assert initial value is false */
    onIsInEditingStateValueChange: (params: { isInEditingState: boolean }) => void;

    evtAction: NonPostableEvt<"ENTER EDITING STATE">;
};

export const SecretsExplorerItem = memo((props: SecretsExplorerItemProps) => {
    const {
        className,
        kind,
        basename,
        isCircularProgressShown,
        evtAction,
        isSelected,
        getIsValidBasename,
        onMouseEvent,
        onEditBasename,
        onIsInEditingStateValueChange
    } = props;

    const { t } = useTranslation({ SecretsExplorerItem });

    const { classes, cx } = useStyles({ isSelected, basename });

    const [isInEditingState, setIsInEditingState] = useState(false);

    useEffectOnValueChange(
        () => onIsInEditingStateValueChange({ isInEditingState }),
        [isInEditingState]
    );

    const { getOnMouseProps } = useClick<"icon" | "text">({
        doubleClickDelayMs: 500,
        callback: ({ type, extraArg: target }) => onMouseEvent({ type, target })
    });

    //TODO: We need a custom hook for this.
    const [evtIsCircularProgressShown] = useState(() =>
        Evt.create(isCircularProgressShown)
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
                        () => setIsInEditingState(true)
                    )
            ),
        [evtAction, evtIsCircularProgressShown]
    );

    const getIsValidValue = useConstCallback((value: string) =>
        getIsValidBasename({ basename: value })
            ? ({ isValidValue: true } as const)
            : ({ isValidValue: false, message: "" } as const)
    );

    const [evtInputAction] = useState(() =>
        Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
    );

    const onInputSubmit = useConstCallback<TextFieldProps["onSubmit"]>(value => {
        setIsInEditingState(false);

        if (value === basename) {
            return;
        }

        onEditBasename({ editedBasename: value });
    });

    const onEscapeKeyDown = useConstCallback(() => setIsInEditingState(false));

    const onEnterKeyDown = useConstCallback(() => evtInputAction.post("TRIGGER SUBMIT"));

    const formattedBasename = useMemo(
        () =>
            smartTrim({
                text: basename,
                maxLength: 21,
                minCharAtTheEnd: 5
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
                                return "secret";
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

const { i18n } = declareComponentKeys<"description">()({ SecretsExplorerItem });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ SecretsExplorerItem })
    .withParams<Pick<SecretsExplorerItemProps, "isSelected" | "basename">>()
    .create(({ theme, isSelected, basename }) => ({
        root: {
            textAlign: "center",
            cursor: "pointer",
            width: theme.spacing(9)
        },
        frame: {
            borderRadius: "5px",
            backgroundColor: isSelected ? "rgba(0, 0, 0, 0.2)" : undefined,
            display: "inline-block",
            padding: theme.muiTheme.spacing(2, 2)
        },
        explorerIcon: {
            height: 60
        },
        text: {
            //"color": theme.palette.text[isSelected ? "primary" : "secondary"]
            //"color": !isSelected ? "rgba(0, 0, 0, 0.62)" : undefined
            color: alpha(
                theme.colors.useCases.typography.textPrimary,
                isSelected ? 1.2 : 0.8
            ),
            wordBreak: /[_\- ]/.test(basename) ? undefined : "break-all"
        },
        hiddenSpan: {
            width: 0,
            overflow: "hidden",
            display: "inline-block"
        },
        input: {
            //NOTE: So that the text does not move when editing start.
            //"marginTop": "2px",
            marginTop: "-1px",

            paddingTop: 0,
            "& .MuiInput-input": {
                textAlign: "center"
            }
        }
    }));
