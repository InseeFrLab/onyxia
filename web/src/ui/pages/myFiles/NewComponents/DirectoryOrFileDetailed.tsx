import { tss } from "tss";
import { ExplorerIcon } from "../Explorer/ExplorerIcon";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { id } from "tsafe";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";

type Props = {
    className?: string;
    name: string;
    kind: "directory" | "file";
    isPublic: boolean;
};

export function DirectoryOrFileDetailed(props: Props) {
    const { name, kind, isPublic, className } = props;
    const { classes, cx } = useStyles();

    const shareIconId = id<MuiIconComponentName>(
        isPublic ? "Visibility" : "VisibilityOff" //Language in figma but do not found the off icon
    );

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.iconWrapper}>
                <ExplorerIcon
                    iconId={(() => {
                        switch (kind) {
                            case "directory":
                                return "directory";
                            case "file":
                                return "data";
                        }
                    })()}
                    hasShadow={false}
                    className={classes.fileOrDirectoryIcon}
                />
            </div>
            <div className={classes.contentWrapper}>
                <Text typo="navigation label">{name}</Text>
                <div className={classes.detailsWrapper}>
                    <Text typo="label 2" className={classes.visibility}>
                        <Icon icon={shareIconId} />
                        &nbsp;
                        {isPublic ? "Dossier public" : "Dossier privé"}
                    </Text>
                </div>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ DirectoryOrFileDetailed }).create(({ theme }) => ({
    "root": {
        "display": "flex",
        "alignItems": "center"
        //"margin": theme.spacing(2)
    },
    "iconWrapper": {
        "paddingRight": theme.spacing(4)
    },
    "fileOrDirectoryIcon": {
        "height": 60
    },
    "contentWrapper": {
        "display": "flex",
        "flexDirection": "column"
    },
    "detailsWrapper": {
        "display": "flex",
        "alignItems": "center"
    },
    "visibility": {
        "display": "flex",
        "alignItems": "center",
        "marginRight": theme.spacing(1)
    },
    "icon": {
        "marginRight": theme.spacing(0.5)
    }
}));
