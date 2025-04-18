import {
    gridClasses,
    type GridDensity,
    gridDensitySelector,
    GridMenu,
    useGridApiContext,
    useGridSelector
} from "@mui/x-data-grid";
import { ButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { memo, useId, useState, useRef } from "react";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import { Icon } from "onyxia-ui/Icon";
import { isHideMenuKey } from "@mui/x-data-grid/utils/keyboardUtils";
import { tss } from "tss";

/**
 * CustomDataGridToolbarDensitySelector is a component that provides a toolbar button
 * for selecting the grid density mode (compact, standard, comfortable) within a MUI DataGrid.
 *
 * This component is designed to be used inside a custom toolbar, such as `CustomDataGridToolbar`,
 * to allow users to toggle between different density views via a dropdown menu. The component needs to be inside `GridToolbarContainer`
 *
 * @see https://mui.com/x/react-data-grid/components/#toolbar
 *
 */
export const CustomDataGridToolbarDensitySelector = memo(() => {
    const apiRef = useGridApiContext();
    const { t } = useTranslation({ CustomDataGridToolbarDensitySelector });

    const { classes } = useStyles();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const density = useGridSelector(apiRef, gridDensitySelector);

    const [open, setOpen] = useState(false);

    const densityButtonId = useId();
    const densityMenuId = useId();

    const handleDensityUpdate = (newDensity: GridDensity) => {
        apiRef.current.setDensity(newDensity);
        setOpen(false);
    };

    const handleClick = () => {
        setOpen(prevOpen => !prevOpen);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleListKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Tab") {
            event.preventDefault();
        }
        if (isHideMenuKey(event.key)) {
            setOpen(false);
        }
    };

    const densityOptions = [
        {
            icon: getIconUrlByName("ViewHeadline"),
            label: t("toolbarDensityCompact"),
            value: "compact" as const
        },
        {
            icon: getIconUrlByName("TableRows"),
            label: t("toolbarDensityStandard"),
            value: "standard" as const
        },
        {
            icon: getIconUrlByName("ViewStreamSharp"),
            label: t("toolbarDensityComfortable"),
            value: "comfortable" as const
        }
    ];
    return (
        <>
            <ButtonBarButton
                startIcon={getIconUrlByName("DensityMediumTwoTone")}
                //htmlId={densityButtonId}
                ref={buttonRef}
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
            >
                {t("toolbarDensity")}
            </ButtonBarButton>
            <GridMenu
                target={buttonRef.current}
                open={open}
                onClose={handleClose}
                position="bottom-start"
            >
                <MenuList
                    id={densityMenuId}
                    aria-labelledby={densityButtonId}
                    onKeyDown={handleListKeyDown}
                    autoFocusItem={open}
                    className={gridClasses.menuList}
                >
                    {densityOptions.map((option, index) => (
                        <MenuItem
                            key={index}
                            selected={option.value === density}
                            onClick={() => handleDensityUpdate(option.value)}
                        >
                            <ListItemIcon>
                                <Icon className={classes.icon} icon={option.icon} />
                            </ListItemIcon>
                            {option.label}
                        </MenuItem>
                    ))}
                </MenuList>
            </GridMenu>
        </>
    );
});
const { i18n } = declareComponentKeys<
    | "toolbarDensity"
    | "toolbarDensityCompact"
    | "toolbarDensityStandard"
    | "toolbarDensityComfortable"
>()({
    CustomDataGridToolbarDensitySelector
});
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ CustomDataGridToolbarDensitySelector })
    .create(({ theme }) => ({
        icon: {
            color: theme.colors.useCases.typography.textPrimary
        }
    }));
