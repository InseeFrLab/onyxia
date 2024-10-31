import {
    type GridCellParams,
    type GridRowSelectionModel,
    type GridColDef,
    type GridCallbackDetails,
    type GridRowParams,
    type GridAutosizeOptions,
    GRID_CHECKBOX_SELECTION_COL_DEF,
    useGridApiRef
} from "@mui/x-data-grid";
import { memo, useMemo, useState } from "react";
import { ExplorerIcon } from "../ExplorerIcon";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { CustomDataGrid } from "ui/shared/Datagrid/CustomDataGrid";
import type { Item } from "../../shared/types";
import { useConstCallback } from "powerhooks/useConstCallback";
import { assert } from "tsafe/assert";
import { useEvt } from "evt/hooks";
import type { NonPostableEvt } from "evt";
import { PolicySwitch } from "../PolicySwitch";
import { CircularProgress } from "onyxia-ui/CircularProgress";

export type ListExplorerItems = {
    className?: string;

    isNavigating: boolean;

    items: Item[];

    onNavigate: (params: { basename: string }) => void;
    onOpenFile: (params: { basename: string }) => void;
    /** Assert initial value is none */
    onSelectedItemKindValueChange: (params: {
        selectedItemKind: "file" | "directory" | "none";
    }) => void;
    onPolicyChange: (params: {
        basename: string;
        policy: Item["policy"];
        kind: Item["kind"];
    }) => void;

    onDeleteItem: (params: { item: Item }, onDeleteConfirmed?: () => void) => void;
    onCopyPath: (params: { basename: string }) => void;
    evtAction: NonPostableEvt<
        "DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH" //TODO: Delete, legacy from secret explorer
    >;
};

type Row = Item & { id: number };

const listAutosizeOptions = {
    expand: true,
    columns: ["basename", "lastModified"],
    includeHeaders: true,
    includeOutliers: true
} satisfies GridAutosizeOptions;

export const ListExplorerItems = memo((props: ListExplorerItems) => {
    const {
        className,
        isNavigating,
        items,
        onNavigate,
        evtAction,
        onCopyPath,
        onDeleteItem,
        onOpenFile,
        onPolicyChange,
        onSelectedItemKindValueChange
    } = props;

    const apiRef = useGridApiRef();

    const { classes, cx } = useStyles();

    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

    const columns: GridColDef<(typeof rows)[number]>[] = useMemo(
        () =>
            [
                {
                    ...GRID_CHECKBOX_SELECTION_COL_DEF,
                    maxWidth: 50,
                    renderCell: params => {
                        if (params.row.isBeingCreated)
                            return (
                                <div className={classes.circularProgressInnerWrapper}>
                                    {(() => {
                                        const item = params.row;
                                        switch (item.kind) {
                                            case "directory":
                                                return <CircularProgress size={32} />;
                                            case "file":
                                                return (
                                                    <>
                                                        <CircularProgress size={32} />
                                                        <div
                                                            className={
                                                                classes.percentageWrapper
                                                            }
                                                        >
                                                            <Text
                                                                typo="caption"
                                                                className={
                                                                    classes.textUploadProgress
                                                                }
                                                            >
                                                                {item.uploadPercent}%
                                                            </Text>
                                                        </div>
                                                    </>
                                                );
                                        }
                                    })()}
                                </div>
                            );

                        assert(GRID_CHECKBOX_SELECTION_COL_DEF.renderCell !== undefined);

                        return GRID_CHECKBOX_SELECTION_COL_DEF.renderCell(params);
                    }
                },
                {
                    field: "basename",
                    headerName: "Name",
                    type: "string",
                    renderCell: params => (
                        <>
                            <ExplorerIcon
                                iconId={
                                    params.row.kind === "directory" ? "directory" : "data"
                                }
                                hasShadow={false}
                                className={classes.nameIcon}
                            />
                            <a>
                                <Text typo="label 2">{params.value}</Text>
                            </a>
                        </>
                    ),
                    cellClassName: classes.basenameCell
                },

                {
                    field: "lastModified",
                    headerName: "Modified",
                    type: "date",
                    valueFormatter: (date?: Date) => {
                        if (!date) return "";
                        return date.toLocaleString();
                    }
                },
                {
                    field: "size",
                    headerName: "Size",
                    type: "number",
                    valueFormatter: size => {
                        if (size === undefined) return "";
                        const prettySize = fileSizePrettyPrint({
                            bytes: size
                        });
                        return `${prettySize.value} ${prettySize.unit}`;
                    }
                },
                {
                    field: "policy",
                    headerName: "Policy",
                    display: "flex" as const,
                    type: "singleSelect",
                    valueOptions: ["public", "private"],
                    renderCell: params => {
                        return (
                            <PolicySwitch
                                policy={params.value}
                                changePolicy={e => {
                                    switch (params.row.policy) {
                                        case "public":
                                            onPolicyChange({
                                                "basename": params.row.basename,
                                                "policy": "private",
                                                "kind": params.row.kind
                                            });
                                            break;
                                        case "private":
                                            onPolicyChange({
                                                "basename": params.row.basename,
                                                "policy": "public",
                                                "kind": params.row.kind
                                            });
                                            break;
                                    }
                                    e.stopPropagation();
                                }}
                                isPolicyChanging={params.row.isPolicyChanging}
                            />
                        );
                    }
                }
            ] satisfies GridColDef<(typeof rows)[number]>[],
        [classes.nameIcon]
    );

    const rows = useMemo(
        () =>
            items.map(
                (item, index) =>
                    ({
                        ...item,
                        id: index // Maybe a better id is necessary due to pagination
                    }) satisfies Row
            ),
        [items]
    );

    useEvt(
        ctx =>
            evtAction.attach(ctx, action => {
                const selectedItem = apiRef.current.getSelectedRows().values().next()
                    .value as Row;
                switch (action) {
                    case "DELETE SELECTED ITEM": {
                        assert(selectedItem !== undefined);
                        onDeleteItem({ "item": selectedItem }, () =>
                            apiRef.current.updateRows([
                                { id: selectedItem.id, _action: "delete" }
                            ])
                        );
                        break;
                    }
                    case "COPY SELECTED ITEM PATH":
                        assert(selectedItem !== undefined);
                        onCopyPath({
                            "basename": selectedItem.basename
                        });
                        break;
                }
            }),
        [evtAction, onDeleteItem, onCopyPath]
    );

    const handleRowSelection = useConstCallback(
        (params: GridRowSelectionModel, details: GridCallbackDetails) => {
            const previousSelectedRows = details.api.getSelectedRows();
            const firstPreviouslySelectedRow = previousSelectedRows.values().next().value;

            const rowIndex = params[0];

            assert(rowIndex === undefined || typeof rowIndex === "number");

            const selectedItemKind =
                params.length === 0
                    ? "none"
                    : firstPreviouslySelectedRow &&
                        firstPreviouslySelectedRow.kind === rows[rowIndex].kind
                      ? undefined // No need to update the kind if it hasn't changed
                      : rows[rowIndex].kind;

            if (selectedItemKind) {
                onSelectedItemKindValueChange({ selectedItemKind });
            }

            setRowSelectionModel(params);
        }
    );

    const handleFileOrDirectoryAction = (params: GridCellParams) => {
        if (params.field !== "basename") return;

        switch (params.row.kind) {
            case "directory":
                return onNavigate({ "basename": params.row.basename });

            case "file":
                return onOpenFile({ "basename": params.row.basename });
        }
    };

    return (
        <div className={cx(classes.root, className)}>
            <CustomDataGrid<Row>
                apiRef={apiRef}
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 25, page: 0 }
                    }
                }}
                isRowSelectable={(params: GridRowParams<Item>) =>
                    !(params.row.isBeingDeleted || params.row.isBeingCreated)
                }
                loading={isNavigating}
                slotProps={{
                    loadingOverlay: {
                        variant: "linear-progress",
                        noRowsVariant: "linear-progress"
                    }
                }}
                onRowSelectionModelChange={handleRowSelection}
                rowSelectionModel={rowSelectionModel}
                onCellDoubleClick={handleFileOrDirectoryAction}
                onCellKeyDown={(params, event) => {
                    if (event.key !== "Enter") return;
                    handleFileOrDirectoryAction(params);
                }}
                autosizeOptions={listAutosizeOptions}
                checkboxSelection
                disableMultipleRowSelection
                disableColumnMenu
            />
        </div>
    );
});

const useStyles = tss.withName({ ListExplorerItems }).create(({ theme }) => ({
    "root": {
        "borderRadius": theme.spacing(1),
        "boxShadow": theme.shadows[1],
        "height": "100%"
    },
    "nameIcon": {
        "width": "30px",
        "height": "30px",
        "marginRight": theme.spacing(2),
        "flexShrink": 0
    },
    "circularProgressInnerWrapper": {
        "position": "relative",
        "display": "inline-flex"
    },
    "basenameCell": {
        "cursor": "pointer",
        "display": "flex",
        "alignItems": "center"
    },
    "percentageWrapper": {
        "position": "absolute",
        "top": 0,
        "left": 0,
        "bottom": 0,
        "right": 0,
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "center"
    },
    "textUploadProgress": {
        "fontSize": theme.typography.rootFontSizePx * 0.6
    }
}));
