import {
    gridPreferencePanelStateSelector,
    GridPreferencePanelsValue,
    useGridApiContext,
    //useGridApiEventHandler,
    useGridSelector
} from "@mui/x-data-grid";
import { ButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { memo } from "react";
//import { autosizeOptions } from "./CustomDataGrid";

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

    // Waiting for https://github.com/mui/mui-x/issues/14922
    // useGridApiEventHandler(apiRef, "columnVisibilityModelChange", () => {
    //     apiRef.current.autosizeColumns(autosizeOptions);
    // });

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
        <ButtonBarButton
            onClick={showColumns}
            startIcon={id<MuiIconComponentName>("ViewColumn")}
        >
            {t("toolbarColumnsLabel")}
        </ButtonBarButton>
    );
});
const { i18n } = declareComponentKeys<"toolbarColumnsLabel">()({
    CustomDataGridToolbarColumnsButton
});
export type I18n = typeof i18n;
