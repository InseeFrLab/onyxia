import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { memo } from "react";
import { Icon } from "onyxia-ui/Icon";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe";
import Tooltip from "@mui/material/Tooltip";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { ExplorerIcon } from "../ExplorerIcon";
import { declareComponentKeys } from "i18nifty";
import { Item } from "../../shared/types";

export type ExplorerItemProps = {
    className?: string;

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

    /** Name displayed under the folder icon*/
    basename: string;

    /** Represent if the item is currently selected */
    isSelected: boolean;

    /** File size in bytes */
    size: number | undefined;

    policy: Item["policy"];
    onDoubleClick: () => void;
    onClick: () => void;
};

export const ExplorerItem = memo((props: ExplorerItemProps) => {
    const {
        className,
        kind,
        basename,
        policy,
        isSelected,
        size,
        onDoubleClick,
        onClick
    } = props;

    const prettySize = size ? fileSizePrettyPrint({ bytes: size }) : null;

    const lastDotIndex = basename.lastIndexOf(".");

    const [baseName, fileType] =
        kind === "file" && lastDotIndex !== -1
            ? [basename.slice(0, lastDotIndex), basename.slice(lastDotIndex + 1)]
            : [basename, undefined];

    const { classes, cx } = useStyles({ isSelected, basename });

    // Handle key events for accessibility
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onDoubleClick();
            return;
        }

        if (e.key === "Enter" || e.key === " ") {
            onClick();
            e.preventDefault();
            return;
        }
    };

    return (
        <div
            className={cx(classes.root, className)}
            tabIndex={0}
            role="option"
            aria-selected={isSelected}
            onDoubleClick={onDoubleClick}
            onClick={onClick}
            onKeyDown={handleKeyDown}
        >
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
                <Icon
                    className={classes.policyIcon}
                    icon={id<MuiIconComponentName>(
                        policy === "public" ? "Visibility" : "VisibilityOff"
                    )}
                />
            </div>

            <div className={classes.textContainer}>
                <Tooltip
                    title={basename}
                    enterDelay={300}
                    enterNextDelay={300}
                    onDoubleClick={e => {
                        console.log("doubleclick Tooltip", e);
                        e.stopPropagation();
                    }}
                    PopperProps={{
                        onDoubleClick: e => {
                            console.log("doubleclick PopperProps", e);
                            e.stopPropagation(); //Prevent from onDoubleClick to be fired in order to let user select the text
                        }
                    }}
                >
                    <Text typo="label 1" className={classes.baseNameText}>
                        {baseName}
                    </Text>
                </Tooltip>
            </div>

            <div className={classes.sizeAndFileTypeText}>
                <Text typo="body 1">
                    {fileType}{" "}
                    {prettySize ? `${prettySize.value} ${prettySize.unit}` : ""}
                </Text>
                {kind === "directory" && (
                    <Icon
                        size="extra small"
                        icon={id<MuiIconComponentName>("ChevronRight")}
                    />
                )}
            </div>
        </div>
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
            "padding": theme.spacing(2.5)
        },
        "iconContainer": { "display": "flex", "justifyContent": "space-between" },
        "explorerIcon": {
            "width": "50px", // Either we set a fixed size, or we measure the size of the root
            "height": "50px"
        },
        "policyIcon": {
            marginLeft: theme.spacing(1) // Adjust spacing between the icons
        },
        "textContainer": {
            "display": "flex",
            "flexDirection": "column",
            "marginTop": theme.spacing(2)
        },
        "baseNameText": {
            "marginBottom": theme.spacing(1),
            "overflow": "hidden",
            "textOverflow": "ellipsis",
            "display": "-webkit-box", // Necessary for line clamping
            "wordWrap": "break-word", // Enable word wrapping
            "WebkitLineClamp": 2, // Limit to 2 lines
            "WebkitBoxOrient": "vertical" // Set the box orientation for multi-line ellipsis
        },
        "sizeAndFileTypeText": {
            "display": "flex",
            "justifyContent": "space-between",
            "whiteSpace": "nowrap",
            "overflow": "hidden",
            "textOverflow": "ellipsis"
        }
    }));
