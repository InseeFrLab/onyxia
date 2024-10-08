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
import { ExplorerIcon } from "../ExplorerIcon";
import { declareComponentKeys } from "i18nifty";

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
    const [baseName, fileType] =
        kind === "file" ? basename.split(".") : [basename, undefined];

    const { classes, cx } = useStyles({ isSelected, basename });

    const { getOnMouseProps } = useClick({
        "doubleClickDelayMs": 500,
        "callback": ({ type }) => onMouseEvent({ type })
    });

    const formattedBasename = useMemo(
        () =>
            smartTrim({
                "text": baseName,
                "maxLength": 12,
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

const { i18n } = declareComponentKeys<"description">()({ ExplorerItem });
export type I18n = typeof i18n;

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
            "display": "flex",
            "flexDirection": "column",
            "justifyContent": "space-between",
            "padding": theme.spacing(3)
        },
        "textContainer": {
            "display": "flex",
            "flexDirection": "column",
            "marginTop": theme.spacing(2)
        },
        "baseNameText": { "marginBottom": theme.spacing(1) },
        "sizeAndFileTypeText": {
            "display": "flex",
            "justifyContent": "space-between"
        },
        "explorerIcon": {
            "width": "50px", // Either we set a fixed size, or we measure the size of the root
            "height": "50px"
        },
        "hiddenSpan": {
            "width": 0,
            "overflow": "hidden",
            "display": "inline-block"
        }
    }));
