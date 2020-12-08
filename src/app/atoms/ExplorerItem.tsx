
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ReactComponent as SecretSvg } from "app/assets/svg/Secret.svg";
import { ReactComponent as FileSvg } from "app/assets/svg/ExplorerFile.svg";
import { ReactComponent as DirectorySvg } from "app/assets/svg/Directory.svg";
import { useTheme } from "@material-ui/core/styles";
import Input from "@material-ui/core/Input";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import { useClick } from "app/utils/hooks/useClick";

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


    isBeingEdited: boolean;

    isRenameRequestBeingProcessed: boolean;

    /** 
     * Invoked when the component have been clicked once 
     * and when it has been double clicked 
     */
    onMouseEvent(params: { type: "down" | "double", target: "icon" | "text" }): void;

    onEditedBasename(params: { editedBasename: string; }): void;

    getIsValidBasename(params: { basename: string; }): boolean;

};

const useStyles = makeStyles(
    theme => createStyles<"root" | "svg" | "frame" | "input", Props>({
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
            "backgroundColor": isSelected ? `rgba(0, 0, 0, 0.2)` : undefined,
            "display": "inline-block"
        }),
        "input": {
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
        isRenameRequestBeingProcessed,
        standardizedWidth,
        onMouseEvent,
        onEditedBasename,
        getIsValidBasename
    } = props;

    const [isBeingEdited, setIsBeingEdited] = useState(props.isBeingEdited);

    useEffect(
        () => { setIsBeingEdited(props.isBeingEdited); },
        [props.isBeingEdited]
    );


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
        ()=>{ setEditedBasename(basename) },
        [basename]
    );

    const [isInputError, setIsInputError] = useState(
        () => !getIsValidBasename({ "basename": editedBasename })
    );

    useEffect(
        () => { 
            setIsInputError(
                !getIsValidBasename({ "basename": editedBasename })
            ); 
        },
        [editedBasename, getIsValidBasename]
    );

    const onEditedBasenameProxy = useCallback(
        () => { 

            if( isInputError ){
                return;
            }

            onEditedBasename({ editedBasename });

        },
        [onEditedBasename, editedBasename, isInputError]
    );

    const { getOnMouseProps } = useClick<{ target: "icon" | "text" }>({
        "doubleClickDelayMs": 500,
        "callback": useCallback(({ type, extraArg: { target } }) => {

            if (type === "down" && isBeingEdited) {
                onEditedBasenameProxy();
            }

            onMouseEvent({ type, target });

        }, [onEditedBasenameProxy, onMouseEvent, isBeingEdited])
    });


    const onChange = useCallback(
        ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setEditedBasename(target.value),
        []
    );

    const onFocus = useCallback(
        ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            target.setSelectionRange(0, target.value.length),
        []
    );


    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            onEditedBasenameProxy();

        },
        [onEditedBasenameProxy]
    );



    return (
        <div className={classes.root}>
            <Box
                className={classes.frame}
                px="6px"
                py="4px"
                {...getOnMouseProps({ "target": "icon" })}
            >
                <SvgComponent width={width} height={height} className={classes.svg} />
            </Box>
            {
                !isBeingEdited ?
                    <>
                        <Typography {...getOnMouseProps({ "target": "text" })} >
                            {basename}
                        </Typography>
                    </>
                    :
                    <form className={classes.root} noValidate autoComplete="off">
                        <Input
                            className={classes.input}
                            defaultValue={editedBasename}
                            inputProps={{ "aria-label": "description" }}
                            autoFocus={true}
                            color="secondary"
                            disabled={isRenameRequestBeingProcessed}
                            endAdornment={
                                !isRenameRequestBeingProcessed ? undefined :
                                    <InputAdornment position="end">
                                        <CircularProgress color="secondary" size={10} />
                                    </InputAdornment>
                            }
                            multiline={true}
                            error={isInputError}
                            onChange={onChange}
                            onFocus={onFocus}
                            onBlur={onEditedBasenameProxy}
                            onKeyDown={onKeyDown}
                        />
                    </form>
            }
        </div>
    );

}


