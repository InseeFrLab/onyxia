
import React, { useMemo } from "react";
import { ReactComponent as SecretSvg } from "app/assets/svg/Secret.svg";
import { ReactComponent as FileSvg } from "app/assets/svg/ExplorerFile.svg";
import { ReactComponent as DirectorySvg } from "app/assets/svg/Directory.svg";
import { useTheme } from "@material-ui/core/styles";
import { useWindowInnerWidth } from "app/utils/hooks/useWindowInnerWidth";

import Typography from "@material-ui/core/Typography";
import { makeStyles, createStyles } from "@material-ui/core/styles";


export type Props = {
    /** What visual asset should be used to represent a file */
    visualRepresentationOfAFile: "secret" | "file";

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

    /** Name displayed under the folder icon*/
    basename: string;

    /** callback invoked when the button is clicked */
    onClick: () => void;
};


const useStyles = makeStyles(
    theme => createStyles<"root" | "svg", Props>({
        "root": {
            "textAlign": "center",
            "cursor": "pointer"
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
            }
        }
    })
);

/** 
 * @protected This is exported only for storybook, use the factory instead.
 */
export function ExplorerItem(props: Props) {

    const { visualRepresentationOfAFile, kind, basename, onClick } = props;

    const theme = useTheme();

    const classes = useStyles(props);

    const { windowInnerWidth } = useWindowInnerWidth();

    /* 
     * NOTE: We can't set the width and height in css ref:
     * https://css-tricks.com/scale-svg/#how-to-scale-svg-to-fit-within-a-certain-size-without-distorting-the-image
     */
    const { width, height } = useMemo(() => {

        const width = (() => {

            if (windowInnerWidth >= theme.breakpoints.width("md")) {

                return theme.spacing(7)

            }

            return theme.spacing(5);

        })();

        return { width, "height": width };

    }, [theme, windowInnerWidth]);

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


    return (
        <div className={classes.root} onClick={onClick}>
            <SvgComponent width={width} height={height} className={classes.svg} />
            <Typography>{basename}</Typography>
        </div>
    );

}


