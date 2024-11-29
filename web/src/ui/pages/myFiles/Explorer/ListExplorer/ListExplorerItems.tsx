import {
    type GridCellParams,
    type GridRowSelectionModel,
    type GridColDef,
    type GridRowParams,
    type GridAutosizeOptions,
    GRID_CHECKBOX_SELECTION_COL_DEF,
    useGridApiRef
} from "@mui/x-data-grid";
import { memo, useEffect, useMemo, useState } from "react";
import { ExplorerIcon } from "../ExplorerIcon";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { CustomDataGrid } from "ui/shared/Datagrid/CustomDataGrid";
import { assert } from "tsafe/assert";
import type { Item } from "../../shared/types";
import { useEvt } from "evt/hooks";
import type { NonPostableEvt } from "evt";
import { PolicySwitch } from "../PolicySwitch";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import Link from "@mui/material/Link";

export type ListExplorerItemsProps = {
    className?: string;

    isNavigating: boolean;

    items: Item[];

    onNavigate: (params: { basename: string }) => void;
    onOpenFile: (params: { basename: string }) => void;
    /** Assert initial value is none */
    onSelectedItemKindValueChange: (params: {
        selectedItemKind: "file" | "directory" | "multiple" | "none";
    }) => void;
    onPolicyChange: (params: {
        basename: string;
        policy: Item["policy"];
        kind: Item["kind"];
    }) => void;

    onDeleteItems: (params: { items: Item[] }, onDeleteConfirmed?: () => void) => void;
    onCopyPath: (params: { basename: string }) => void;
    onShare: (params: { fileBasename: string }) => void;
    evtAction: NonPostableEvt<
        "DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH" | "SHARE SELECTED FILE"
    >;
};

type Row = Item & { id: number };

const listAutosizeOptions = {
    expand: true,
    columns: ["basename", "lastModified"],
    includeHeaders: true,
    includeOutliers: true
} satisfies GridAutosizeOptions;

export const ListExplorerItems = memo((props: ListExplorerItemsProps) => {
    const {
        className,
        isNavigating,
        items,
        onNavigate,
        evtAction,
        onCopyPath,
        onDeleteItems,
        onOpenFile,
        onPolicyChange,
        onSelectedItemKindValueChange,
        onShare
    } = props;

    const apiRef = useGridApiRef();

    const { classes, cx } = useStyles();

    const { t } = useTranslation({ ListExplorerItems });
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
                    headerName: t("header name"),
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
                            <Link
                                onClick={e => {
                                    e.stopPropagation();
                                    switch (params.row.kind) {
                                        case "directory":
                                            return onNavigate({
                                                basename: params.row.basename
                                            });

                                        case "file":
                                            return onOpenFile({
                                                basename: params.row.basename
                                            });
                                    }
                                }}
                                color="inherit"
                            >
                                <Text typo="label 2">{params.value}</Text>
                            </Link>
                        </>
                    ),
                    cellClassName: classes.basenameCell
                },

                {
                    field: "lastModified",
                    headerName: t("header modified date"),
                    type: "date",
                    valueFormatter: (date?: Date) => {
                        if (!date) return "";
                        return date.toLocaleString();
                    }
                },
                {
                    field: "size",
                    headerName: t("header size"),
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
                    headerName: t("header policy"),
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
                                                basename: params.row.basename,
                                                policy: "private",
                                                kind: params.row.kind
                                            });
                                            break;
                                        case "private":
                                            onPolicyChange({
                                                basename: params.row.basename,
                                                policy: "public",
                                                kind: params.row.kind
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
                const selectedItems = Array.from(
                    apiRef.current.getSelectedRows().values()
                ) as Row[];

                switch (action) {
                    case "DELETE SELECTED ITEM": {
                        assert(selectedItems !== undefined);
                        onDeleteItems({ items: selectedItems }, () =>
                            selectedItems.forEach(item =>
                                apiRef.current.updateRows([
                                    { id: item.id, _action: "delete" }
                                ])
                            )
                        );
                        break;
                    }
                    case "COPY SELECTED ITEM PATH":
                        assert(selectedItems !== undefined && selectedItems.length === 1);
                        onCopyPath({
                            basename: selectedItems[0].basename
                        });
                        break;
                    case "SHARE SELECTED FILE":
                        assert(
                            selectedItems.length === 1 && selectedItems[0].kind === "file"
                        );
                        onShare({
                            fileBasename: selectedItems[0].basename
                        });
                        return;
                }
            }),
        [evtAction, onDeleteItems, onCopyPath]
    );

    useEffect(() => {
        onSelectedItemKindValueChange({ selectedItemKind: "none" });
        setRowSelectionModel([]);
    }, [isNavigating]);

    useEffect(() => {
        if (rowSelectionModel.length === 0) {
            onSelectedItemKindValueChange({ selectedItemKind: "none" });
            return;
        }

        if (rowSelectionModel.length === 1) {
            onSelectedItemKindValueChange({
                selectedItemKind: rows[rowSelectionModel[0] as Row["id"]].kind
            });
            return;
        }
        onSelectedItemKindValueChange({ selectedItemKind: "multiple" });
    }, [rowSelectionModel]);

    const handleFileOrDirectoryAction = (params: GridCellParams) => {
        if (params.field !== "basename") return;

        switch (params.row.kind) {
            case "directory":
                return onNavigate({ basename: params.row.basename });

            case "file":
                return onOpenFile({ basename: params.row.basename });
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
                onRowSelectionModelChange={setRowSelectionModel}
                rowSelectionModel={rowSelectionModel}
                onRowClick={(params, event) => {
                    if (rowSelectionModel.includes(params.id)) return;

                    if (event.metaKey) {
                        return setRowSelectionModel(prev => [...prev, params.id]);
                    }

                    setRowSelectionModel([params.id]);
                }}
                loading={isNavigating}
                slotProps={{
                    loadingOverlay: {
                        variant: "linear-progress",
                        noRowsVariant: "linear-progress"
                    }
                }}
                disableRowSelectionOnClick
                onCellDoubleClick={handleFileOrDirectoryAction}
                onCellKeyDown={(params, event) => {
                    if (event.key !== "Enter") return;
                    handleFileOrDirectoryAction(params);
                }}
                autosizeOptions={listAutosizeOptions}
                checkboxSelection
                disableColumnMenu
            />
        </div>
    );
});

const { i18n } = declareComponentKeys<
    "header name" | "header modified date" | "header size" | "header policy"
>()({ ListExplorerItems });
export type I18n = typeof i18n;

const useStyles = tss.withName({ ListExplorerItems }).create(({ theme }) => ({
    root: {
        borderRadius: theme.spacing(1),
        boxShadow: theme.shadows[1],
        height: "100%"
    },
    nameIcon: {
        width: "30px",
        height: "30px",
        marginRight: theme.spacing(2),
        flexShrink: 0
    },
    circularProgressInnerWrapper: {
        position: "relative",
        display: "inline-flex"
    },
    basenameCell: {
        cursor: "pointer",
        display: "flex",
        alignItems: "center"
    },
    percentageWrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    textUploadProgress: {
        fontSize: theme.typography.rootFontSizePx * 0.6
    }
}));
