import { makeStyles } from "ui/theme";
import { useMemo, memo } from "react";
import { useDomRect } from "powerhooks/useDomRect";
import { ReactComponent as SvgDataWithShadow } from "ui/assets/svg/explorer/dataWithShadow.svg";
import { ReactComponent as SvgSecretWithShadow } from "ui/assets/svg/explorer/secretWithShadow.svg";
import { ReactComponent as SvgDirectoryWithShadow } from "ui/assets/svg/explorer/directoryWithShadow.svg";
import { ReactComponent as SvgData } from "ui/assets/svg/explorer/data.svg";
import { ReactComponent as SvgSecret } from "ui/assets/svg/explorer/secret.svg";
import { ReactComponent as SvgDirectory } from "ui/assets/svg/explorer/directory.svg";

//Figma -> Inkscape -> https://svg2jsx.com/

export type Props = {
    /** A height (and no with) must be provided explicitly */
    className?: string;
    iconId: "data" | "secret" | "directory";
    hasShadow: boolean;
};

export const ExplorerIcon = memo((props: Props) => {
    const { className, iconId, hasShadow } = props;

    const {
        ref,
        domRect: { height },
    } = useDomRect();

    const { cx, classes } = useStyles({ height, iconId, hasShadow });

    const SvgReactComponent = useMemo(() => {
        switch (iconId) {
            case "data":
                return hasShadow ? SvgDataWithShadow : SvgData;
            case "secret":
                return hasShadow ? SvgSecretWithShadow : SvgSecret;
            case "directory":
                return hasShadow ? SvgDirectoryWithShadow : SvgDirectory;
        }
    }, [iconId, hasShadow]);

    return (
        <div ref={ref} className={cx(classes.root, className)}>
            <SvgReactComponent className={classes.svg} />
        </div>
    );
});

const useStyles = makeStyles<{ height: number } & Pick<Props, "iconId" | "hasShadow">>({
    "name": { ExplorerIcon },
})((theme, { height, iconId, hasShadow }) => ({
    "root": {
        height,
        "width":
            (() => {
                switch (iconId) {
                    case "data":
                        return hasShadow ? 0.88 : 0.87;
                    case "secret":
                        return 0.87;
                    case "directory":
                        return 1.26;
                }
            })() * height,
        "position": "relative",
    },
    "svg": {
        "position": "absolute",
        "fill": "currentColor",
        "color": (() => {
            switch (iconId) {
                case "directory":
                    return theme.colors.useCases.typography.textFocus;
                default:
                    return theme.colors.palette[
                        theme.isDarkModeEnabled ? "light" : "dark"
                    ].main;
            }
        })(),
        "height":
            height *
            (!hasShadow
                ? 1
                : (() => {
                      switch (iconId) {
                          case "data":
                              return 1.31;
                          case "secret":
                              return 1.12;
                          case "directory":
                              return 1.185;
                      }
                  })()),
        "top": !hasShadow
            ? 0
            : -(
                  (() => {
                      switch (iconId) {
                          case "data":
                              return 4;
                          case "secret":
                              return 1;
                          case "directory":
                              return 2;
                      }
                  })() / 100
              ) * height,
        "left": !hasShadow
            ? 0
            : -(
                  (() => {
                      switch (iconId) {
                          case "data":
                              return 10;
                          case "secret":
                              return 6;
                          case "directory":
                              return 4;
                      }
                  })() / 100
              ) * height,
    },
}));
