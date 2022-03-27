import { makeStyles } from "ui/theme";
import { useMemo, memo } from "react";
import { ReactComponent as SecretSvg } from "ui/assets/svg/Secret.svg";
import { ReactComponent as FileSvg } from "ui/assets/svg/ExplorerFile.svg";
import { ReactComponent as DirectorySvg } from "ui/assets/svg/Directory.svg";

export type Props = {
    className?: string;

    explorerType: "s3" | "secrets";

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";
};

export const FileOrDirectoryIcon = memo((props: Props) => {
    const { className, explorerType, kind } = props;

    const { classes, cx } = useStyles({ kind });

    const SvgComponent = useMemo(() => {
        switch (kind) {
            case "directory":
                return DirectorySvg;
            case "file":
                switch (explorerType) {
                    case "s3":
                        return FileSvg;
                    case "secrets":
                        return SecretSvg;
                }
        }
    }, [kind, explorerType]);

    return <SvgComponent className={cx(classes.root, className)} />;
});

const useStyles = makeStyles<Pick<Props, "kind">>({
    "name": { FileOrDirectoryIcon },
})((theme, { kind }) => ({
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
        "height": 60,
        "display": "block",
    },
}));
