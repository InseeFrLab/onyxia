import {
    gridColumnVisibilityModelSelector,
    gridPreferencePanelStateSelector,
    GridPreferencePanelsValue,
    useGridApiContext,
    useGridSelector
} from "@mui/x-data-grid";
import { ButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { memo, useEffect } from "react";
import { autosizeOptions } from "./CustomDataGrid";
import { getIconUrlByName } from "lazy-icons";

/**
 * CustomDataGridToolbarColumnsButton is a component that provides a toolbar button
 * for toggling the visibility of the columns preference panel within a MUI DataGrid.
 *
 * This component is designed to be used inside a custom toolbar, such as `CustomDataGridToolbar`,
 * and must be placed inside the `GridToolbarContainer` to function properly.
 *
 * When the button is clicked, it either shows or hides the DataGrid's columns preference panel,
 * allowing users to manage the visibility of the grid's columns.
 *
 * @see https://mui.com/x/react-data-grid/components/#toolbar
 *
 */
export const CustomDataGridToolbarColumnsButton = memo(() => {
    const apiRef = useGridApiContext();
    const { t } = useTranslation({ CustomDataGridToolbarColumnsButton });

    const preferencePanel = useGridSelector(apiRef, gridPreferencePanelStateSelector);

    const columnVisibilityModel = useGridSelector(
        apiRef,
        gridColumnVisibilityModelSelector
    );

    useEffect(() => {
        apiRef.current.autosizeColumns(autosizeOptions); //Maybe there is a way to get the autosizeOptions with a selector ?
    }, [columnVisibilityModel]);

    const showColumns = () => {
        if (
            preferencePanel.open &&
            preferencePanel.openedPanelValue === GridPreferencePanelsValue.columns
        ) {
            apiRef.current.hidePreferences();
        } else {
            apiRef.current.showPreferences(GridPreferencePanelsValue.columns);
        }
    };

    return (
        <ButtonBarButton onClick={showColumns} startIcon={getIconUrlByName("ViewColumn")}>
            {t("toolbarColumnsLabel")}
        </ButtonBarButton>
    );
});
const { i18n } = declareComponentKeys<"toolbarColumnsLabel">()({
    CustomDataGridToolbarColumnsButton
});
export type I18n = typeof i18n;
