import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { useMemo, memo } from "react";
import { useClick } from "powerhooks/useClick";
import { smartTrim } from "ui/tools/smartTrim";
import { Icon } from "onyxia-ui/Icon";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe";
import { Tooltip } from "onyxia-ui/Tooltip";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { ExplorerIcon } from "../../Explorer/ExplorerIcon";

export type ExplorerItemProps = {
    className?: string;

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

    /** Name displayed under the folder icon*/
    basename: string;

    /** Represent if the item is currently selected */
    isSelected: boolean;

    /** File or directory size in bytes */
    size: number;
    /**
     * Invoked when the component have been clicked once
     * and when it has been double clicked
     */
    onMouseEvent: (params: { type: "down" | "double" }) => void;
};

export const ExplorerItem = memo((props: ExplorerItemProps) => {
    const { className, kind, basename, isSelected, size, onMouseEvent } = props;

    const prettySize = fileSizePrettyPrint({
        "bytes": size
    });
    const fileType = kind === "file" ? ".csv" : undefined;

    const { classes, cx } = useStyles({ isSelected, basename });

    const { getOnMouseProps } = useClick({
        "doubleClickDelayMs": 500,
        "callback": ({ type }) => onMouseEvent({ type })
    });

    const formattedBasename = useMemo(
        () =>
            smartTrim({
                "text": basename,
                "maxLength": 13,
                "minCharAtTheEnd": 3
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
        <Tooltip title={basename}>
            <div className={cx(classes.root, className)} {...getOnMouseProps()}>
                <div className={classes.iconContainer}>
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
                <div className={classes.textContainer}>
                    <Text typo="navigation label" className={classes.baseNameText}>
                        {formattedBasename}
                    </Text>
                    <div className={classes.sizeAndFileTypeText}>
                        <Text typo="body 1">
                            {fileType} {prettySize.value}
                            {prettySize.unit}
                        </Text>
                        {kind === "directory" && (
                            <Icon
                                size="extra small"
                                icon={id<MuiIconComponentName>("ChevronRight")}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Tooltip>
    );
});

const useStyles = tss
    .withName({ ExplorerItem })
    .withParams<Pick<ExplorerItemProps, "isSelected" | "basename">>()
    .create(({ theme, isSelected }) => ({
        "root": {
            "borderRadius": "16px",
            "backgroundColor": isSelected
                ? theme.colors.useCases.surfaces.surface1
                : "rgba(0, 0, 0, 0.05)",
            "cursor": "pointer",
            "display": "grid",
            "gridTemplateColumns": "1fr 1fr",
            "gridTemplateRows": "2fr",
            "padding": theme.spacing(3)
        },
        "iconContainer": {
            "gridColumn": 1,
            "gridRow": 1,
            padding: theme.spacing(2)
        },
        "textContainer": {
            "gridColumn": "1 / 3",
            "gridRow": 2,
            "marginTop": theme.spacing(4),
            "display": "flex",
            "flexDirection": "column",
            "justifyContent": "flex-end",
            "alignSelf": "flex-end"
        },
        "baseNameText": {},
        "sizeAndFileTypeText": {
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "space-between"
        },
        "explorerIcon": {},
        "hiddenSpan": {
            "width": 0,
            "overflow": "hidden",
            "display": "inline-block"
        }
    }));
