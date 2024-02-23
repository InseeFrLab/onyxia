import { tss } from "tss";
import { memo } from "react";
import dataSvgUrl from "ui/assets/svg/explorer/data.svg";
import directorySvgUrl from "ui/assets/svg/explorer/directory.svg";
import { ThemedImage } from "onyxia-ui/ThemedImage";

export type Props = {
    className?: string;
    iconId: "data" | "directory";
    hasShadow: boolean;
};

export const ExplorerIcon = memo((props: Props) => {
    const { className, iconId, hasShadow } = props;

    const { cx, classes } = useStyles({ hasShadow, iconId });

    return (
        <ThemedImage
            className={cx(classes.root, className)}
            url={(() => {
                switch (iconId) {
                    case "data":
                        console.log("dataSvgUrl", dataSvgUrl);
                        return dataSvgUrl;
                    case "directory":
                        console.log("directorySvgUrl", directorySvgUrl);
                        return directorySvgUrl;
                }
            })()}
        />
    );
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
