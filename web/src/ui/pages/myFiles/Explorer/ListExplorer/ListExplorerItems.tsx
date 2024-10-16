import { type GridColDef } from "@mui/x-data-grid";
import { memo, useMemo } from "react";
import { ExplorerIcon } from "../ExplorerIcon";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { id } from "tsafe";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { Icon } from "onyxia-ui/Icon";
import { CustomDataGrid } from "ui/shared/Datagrid/CustomDataGrid";
import type { Item } from "../../shared/types";

export type ListExplorerItems = {
    className?: string;

    items: Item[];
};

export const ListExplorerItems = memo((props: ListExplorerItems) => {
    const { className, items } = props;

    const { classes, cx } = useStyles();

    const rows = items.map((item, index) => ({
        ...item,
        id: index, // Maybe a better id is necessary due to pagination
        lastModified:
            "lastModified" in item && item.lastModified
                ? item.lastModified.toLocaleString()
                : null
    }));

    const columns = useMemo(
        () =>
            [
                {
                    field: "basename",
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
                        if (size === undefined) return null;
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
        "marginRight": theme.spacing(2),
        "flexShrink": 0
    }
}));
