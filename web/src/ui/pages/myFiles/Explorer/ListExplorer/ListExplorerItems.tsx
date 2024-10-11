import { DataGrid, type GridColDef, useGridApiRef } from "@mui/x-data-grid";
import { memo, useMemo } from "react";
import { ExplorerIcon } from "../ExplorerIcon";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { id } from "tsafe";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { Icon } from "onyxia-ui/Icon";
import { CustomDataGrid } from "ui/shared/Datagrid/CustomDataGrid";

export type ListExplorerItems = {
    className?: string;

    objects: {
        kind: "file" | "directory";
        size: number;
        name: string;
        lastModified: Date;
        policy: "public" | "private" | "diffusion";
    }[];
};

export const ListExplorerItems = memo((props: ListExplorerItems) => {
    const { className, objects } = props;

    const { classes, cx } = useStyles();

    const rows = objects.map((obj, index) => ({
        ...obj,
        id: index, // Maybe a better id is necessary due to pagination
        lastModified: obj.lastModified.toLocaleString()
    }));

    const columns = useMemo(
        () =>
            [
                {
                    field: "name",
                    headerName: "Name",
                    display: "flex" as const,
                    renderCell: params => (
                        <>
                            <ExplorerIcon
                                iconId={
                                    params.row.kind === "directory" ? "directory" : "data"
                                }
                                hasShadow={false}
                                className={classes.nameIcon}
                            />
                            <Text typo="label 2">{params.value}</Text>
                        </>
                    )
                },
                {
                    field: "size",
                    headerName: "Size",
                    valueFormatter: size => {
                        const prettySize = fileSizePrettyPrint({
                            bytes: size
                        });
                        return `${prettySize.value} ${prettySize.unit}`;
                    }
                },
                {
                    field: "lastModified",
                    headerName: "Modified"
                },
                {
                    field: "policy",
                    headerName: "Policy",
                    display: "flex" as const,
                    renderCell: params => (
                        <Icon
                            icon={id<MuiIconComponentName>(
                                (() => {
                                    switch (params.value) {
                                        case "public":
                                            return "Visibility";
                                        case "private":
                                            return "VisibilityOff";
                                        case "diffusion":
                                            return "Language";
                                        default:
                                            return "HelpOutline";
                                    }
                                })()
                            )}
                        />
                    )
                }
            ] satisfies GridColDef[],
        [classes.nameIcon]
    );
    console.log("ListExplorerItems", props);
    return (
        <div className={cx(classes.root, className)}>
            <CustomDataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 25, page: 0 }
                    }
                }}
                checkboxSelection
                disableColumnMenu
                autosizeOnMount
                autosizeOptions={{
                    expand: true,
                    includeHeaders: true,
                    includeOutliers: true
                }}
            />
        </div>
    );
});

const useStyles = tss.withName({ ListExplorerItems }).create(({ theme }) => ({
    "root": {
        "borderRadius": theme.spacing(1),
        "boxShadow": theme.shadows[1],
        "overflow": "hidden"
    },
    "nameIcon": {
        "width": "30px",
        "height": "30px",
        "marginRight": theme.spacing(2)
    }
}));
