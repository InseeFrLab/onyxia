import { makeStyles } from "ui/theme";
import { useMemo, memo } from "react";
import { ReactComponent as SecretSvg } from "ui/assets/svg/Secret.svg";
import { ReactComponent as FileSvg } from "ui/assets/svg/ExplorerFile.svg";
import { ReactComponent as DirectorySvg } from "ui/assets/svg/Directory.svg";

export type Props = {
    /** [HIGHER ORDER] What visual asset should be used to represent a file */
    visualRepresentationOfAFile: "secret" | "file";

    /** Big for large screen, normal otherwise */
    standardizedWidth: "normal" | "big";

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";
};

export const FileOrDirectoryIcon = memo((props: Props) => {
    const { visualRepresentationOfAFile, kind } = props;

    const { classes } = useStyles(props);

    const SvgComponent = useMemo(() => {
        switch (kind) {
            case "directory":
                return DirectorySvg;
            case "file":
                switch (visualRepresentationOfAFile) {
                    case "file":
                        return FileSvg;
                    case "secret":
                        return SecretSvg;
                }
        }
    }, [kind, visualRepresentationOfAFile]);

    return <SvgComponent className={classes.root} />;
});

const useStyles = makeStyles<Props>({ "name": { FileOrDirectoryIcon } })(
    (theme, { kind, standardizedWidth }) => ({
        "root": {
            "fill": "currentColor",
            "color": (() => {
                switch (kind) {
                    case "directory":
                        return theme.colors.useCases.typography.textFocus;
                    case "file":
                        return theme.colors.palette[
                            theme.isDarkModeEnabled ? "light" : "dark"
                        ].main;
                }
            })(),
            ...(() => {
                const width = (() => {
                    switch (standardizedWidth) {
                        case "big":
                            return 100;
                        case "normal":
                            return 60;
                    }
                })();

                return { width, "height": ~~((width * 8) / 10) };
            })(),
            "display": "block",
        },
    }),
);
