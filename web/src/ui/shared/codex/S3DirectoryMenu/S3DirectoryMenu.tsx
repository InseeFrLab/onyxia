import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import { Icon, type IconProps } from "onyxia-ui/Icon";
import { tss } from "tss";

export type S3DirectoryMenuAction = {
    id: string;
    label: string;
    icon: IconProps["icon"];
    /** Undefined callbacks keep an existing action visible, but disabled. */
    onClick: (() => void) | undefined;
};

export type S3DirectoryMenuProps = {
    className?: string;
    id: string;
    labelledBy: string;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    /** Already translated actions, grouped in display order. Empty groups are omitted. */
    actionGroups: S3DirectoryMenuAction[][];
};

export function S3DirectoryMenu(props: S3DirectoryMenuProps) {
    const { className, id, labelledBy, anchorEl, onClose, actionGroups } = props;
    const { classes, cx } = useStyles();

    return (
        <Menu
            open={anchorEl !== null}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{ paper: { className: cx(classes.root, className) } }}
            MenuListProps={{
                id,
                "aria-labelledby": labelledBy,
                className: classes.list
            }}
        >
            {actionGroups
                .filter(group => group.length > 0)
                .flatMap((group, groupIndex) => [
                    ...(groupIndex === 0
                        ? []
                        : [
                              <Divider
                                  key={`divider-${groupIndex}`}
                                  component="li"
                                  className={classes.divider}
                              />
                          ]),
                    ...group.map(action => (
                        <MenuItem
                            key={action.id}
                            className={classes.item}
                            disabled={action.onClick === undefined}
                            onClick={() => {
                                onClose();
                                action.onClick?.();
                            }}
                        >
                            <Icon className={classes.icon} icon={action.icon} />
                            {action.label}
                        </MenuItem>
                    ))
                ])}
        </Menu>
    );
}

const useStyles = tss.withName({ S3DirectoryMenu }).create(({ theme }) => ({
    root: {
        marginTop: theme.spacing(1),
        width: 300,
        maxWidth: "calc(100vw - 32px)",
        borderRadius: 12,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        backgroundImage: "none",
        color: theme.colors.useCases.typography.textPrimary,
        boxShadow: theme.shadows[4]
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        padding: theme.spacing(2)
    },
    item: {
        ...theme.typography.variants["label 1"].style,
        minHeight: 32,
        gap: theme.spacing(1),
        padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
        borderRadius: 8,
        whiteSpace: "normal",
        "&:hover, &.Mui-focusVisible": {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        }
    },
    icon: {
        width: 16,
        height: 16,
        flexShrink: 0
    },
    divider: {
        "&.MuiDivider-root": {
            margin: 0,
            borderColor: theme.colors.useCases.surfaces.surface2
        }
    }
}));
