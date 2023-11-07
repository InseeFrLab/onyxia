import { tss } from "tss";
import { useMemo, memo } from "react";
import { ReactComponent as SvgData } from "ui/assets/svg/explorer/data.svg";
import { ReactComponent as SvgSecret } from "ui/assets/svg/explorer/secret.svg";
import { ReactComponent as SvgDirectory } from "ui/assets/svg/explorer/directory.svg";

//Figma -> Inkscape -> https://svg2jsx.com/

export type Props = {
    className?: string;
    iconId: "data" | "secret" | "directory";
    hasShadow: boolean;
};

export const ExplorerIcon = memo((props: Props) => {
    const { className, iconId, hasShadow } = props;

    const { cx, classes } = useStyles({ hasShadow, iconId });

    const SvgReactComponent = useMemo(() => {
        switch (iconId) {
            case "data":
                return SvgData;
            case "secret":
                return SvgSecret;
            case "directory":
                return SvgDirectory;
        }
    }, [iconId, hasShadow]);

    return <SvgReactComponent className={cx(classes.root, className)} />;
});

const useStyles = tss
    .withName({ ExplorerIcon })
    .withParams<Pick<Props, "hasShadow" | "iconId">>()
    .create(({ theme, hasShadow, iconId }) => ({
        "root": {
            "filter": hasShadow
                ? "drop-shadow(0px 4px 4px rgba(44, 50, 63, 0.2))"
                : undefined,
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
            "display": "block"
        }
    }));
