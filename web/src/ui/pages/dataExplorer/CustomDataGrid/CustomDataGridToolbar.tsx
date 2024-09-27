import { memo } from "react";
import { GridToolbarContainer, useGridApiContext } from "@mui/x-data-grid";
import { ButtonBarButton } from "onyxia-ui/ButtonBarButton";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import DataExplorer from "../DataExplorer";
import { useCoreState } from "core";
import { BaseBar } from "onyxia-ui/BaseBar";
import { CustomDataGridToolbarDensitySelector } from "ui/shared/Datagrid/CustomDataGridToolbarDensitySelector";
import { CustomDataGridToolbarColumnsButton } from "ui/shared/Datagrid/CustomDataGridToolbarColumnsButton";

export const CustomDataGridToolbar = memo(() => {
    const { classes } = useStyles();
    return (
        <GridToolbarContainer>
            <BaseBar className={classes.root}>
                <CustomDataGridToolbarColumnsButton />
                <CustomDataGridToolbarDensitySelector />
                <DownloadButton />
                <ResizeButton />
            </BaseBar>
        </GridToolbarContainer>
    );
});

const useStyles = tss.withName({ CustomDataGridToolbar }).create(({ theme }) => ({
    "root": {
        "flex": 1,
        "marginBottom": theme.spacing(2)
    }
}));

function ResizeButton() {
    const apiRef = useGridApiContext();

    return (
        <ButtonBarButton
            startIcon={id<MuiIconComponentName>("AspectRatio")}
            onClick={() => {
                console.log("ok log", apiRef.current);
                apiRef.current.autosizeColumns({
                    expand: true,
                    includeHeaders: true,
                    includeOutliers: true
                });
            }}
        >
            Redimentionner
        </ButtonBarButton>
    );
}
function DownloadButton() {
    const { t } = useTranslation({ DataExplorer });

    const { fileDownloadUrl } = useCoreState("dataExplorer", "main");

    return (
        <ButtonBarButton
            startIcon={id<MuiIconComponentName>("Download")}
            href={fileDownloadUrl}
            doOpenNewTabIfHref={true}
        >
            {t("download file")}
        </ButtonBarButton>
    );
}
