import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { memo } from "react";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import Tooltip from "@mui/material/Tooltip";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { ExplorerIcon, getIconIdFromExtension } from "../ExplorerIcon";
import { declareComponentKeys } from "i18nifty";
import { Item } from "../../shared/types";
import { PolicySwitch } from "../PolicySwitch";

export type ExplorerItemProps = {
    className?: string;

    /** Tell if we are displaying an directory or a file */
    kind: "file" | "directory";

    /** Name displayed under the folder icon*/
    basename: string;

    /** Represent if the item is currently selected */
    isSelected: boolean;

    isCircularProgressShown: boolean;
    isPolicyChanging: boolean;

    /** File size in bytes */
    size: number | undefined;
    isBucketPolicyFeatureEnabled: boolean;
    policy: Item["policy"];
    onPolicyChange: () => void;
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
        onPolicyChange,
        onClick,
        isPolicyChanging,
        isBucketPolicyFeatureEnabled
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
                                return getIconIdFromExtension(fileType);
                        }
                    })()}
                    hasShadow={true}
                />
                {isBucketPolicyFeatureEnabled && (
                    <PolicySwitch
                        policy={policy}
                        className={classes.policyIcon}
                        changePolicy={onPolicyChange}
                        isPolicyChanging={isPolicyChanging}
                    />
                )}
            </div>

            <div className={classes.textContainer}>
                <Tooltip
                    title={basename}
                    enterDelay={300}
                    enterNextDelay={300}
                    PopperProps={{
                        onDoubleClick: e => {
                            e.stopPropagation(); //Prevent from onDoubleClick to be fired in order to let user select the text
                        }
                    }}
                >
                    <Text
                        typo="label 1"
                        className={classes.baseNameText}
                        componentProps={{}}
                    >
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
                    <Icon size="extra small" icon={getIconUrlByName("ChevronRight")} />
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
        root: {
            borderRadius: "16px",
            backgroundColor: isSelected
                ? theme.colors.useCases.surfaces.surface1
                : "rgba(0, 0, 0, 0.05)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: theme.spacing(2.5)
        },
        iconContainer: { display: "flex", justifyContent: "space-between" },
        explorerIcon: {
            width: "50px", // Either we set a fixed size, or we measure the size of the root
            height: "50px"
        },
        policyIcon: {
            padding: 0,
            marginLeft: theme.spacing(1) // Adjust spacing between the icons
        },
        textContainer: {
            display: "flex",
            flexDirection: "column",
            marginTop: theme.spacing(2)
        },
        baseNameText: {
            marginBottom: theme.spacing(1),
            wordBreak: "break-all",
            overflow: "hidden",
            textOverflow: "ellipsis",
            height: `calc(${theme.typography.variants["label 1"].style.lineHeight} * 2)`
        },
        sizeAndFileTypeText: {
            display: "flex",
            justifyContent: "space-between",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
        }
    }));
