import { memo } from "react";
import { GridToolbarContainer, useGridApiContext } from "@mui/x-data-grid";
import { ButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import { BaseBar } from "onyxia-ui/BaseBar";
import { CustomDataGridToolbarDensitySelector } from "ui/shared/Datagrid/CustomDataGridToolbarDensitySelector";
import { CustomDataGridToolbarColumnsButton } from "ui/shared/Datagrid/CustomDataGridToolbarColumnsButton";
import { autosizeOptions } from "ui/shared/Datagrid/CustomDataGrid";

export const SlotsDataGridToolbar = memo(() => {
    const { classes } = useStyles();
    return (
        <GridToolbarContainer>
            <BaseBar className={classes.root}>
                <CustomDataGridToolbarColumnsButton />
                <CustomDataGridToolbarDensitySelector />
                <ResizeButton />
            </BaseBar>
        </GridToolbarContainer>
    );
});

function ResizeButton() {
    const apiRef = useGridApiContext();
    const { t } = useTranslation("DataExplorer");

    return (
        <ButtonBarButton
            startIcon={getIconUrlByName("AspectRatio")}
            onClick={() => {
                apiRef.current.autosizeColumns(autosizeOptions);
            }}
        >
            {t("resize table")}
        </ButtonBarButton>
    );
}

const useStyles = tss.withName({ SlotsDataGridToolbar }).create(({ theme }) => ({
    root: {
        flex: 1,
        marginBottom: theme.spacing(2)
    }
}));
