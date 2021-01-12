
import { useMemo } from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { ReactComponent as SecretSvg } from "app/assets/svg/Secret.svg";
import { ReactComponent as FileSvg } from "app/assets/svg/ExplorerFile.svg";
import { ReactComponent as DirectorySvg } from "app/assets/svg/Directory.svg";

export type Props = {
    /** [HIGHER ORDER] What visual asset should be used to represent a file */
    visualRepresentationOfAFile: "secret" | "file";

    /** Big for large screen, normal otherwise */
    standardizedWidth: "normal" | "big" | "forHeader";

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

};

const useStyles = makeStyles(
    theme => createStyles<"root", Props>({
        "root": {
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
        }
    })
);


export function FileOrDirectoryIcon(props: Props) {

    const { visualRepresentationOfAFile, standardizedWidth, kind } = props;

    const classes = useStyles(props);

    /* 
     * NOTE: We can't set the width and height in css ref:
     * https://css-tricks.com/scale-svg/#how-to-scale-svg-to-fit-within-a-certain-size-without-distorting-the-image
     */
    const { width, height } = useMemo(
        () => {

            const width = (() => {
                switch (standardizedWidth) {
                    case "forHeader": return 120;
                    case "big": return 100;
                    case "normal": return 60;

                }
            })();

            return { width, "height": ~~(width * 8 / 10) };

        },
        [standardizedWidth]
    );

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
        <SvgComponent
            className={classes.root}
            width={width}
            height={height}
        />
    );

}