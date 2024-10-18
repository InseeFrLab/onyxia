import { GridRowParams, type GridColDef } from "@mui/x-data-grid";
import { memo, useMemo } from "react";
import { ExplorerIcon } from "../ExplorerIcon";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { id } from "tsafe";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { Icon } from "onyxia-ui/Icon";
import { CustomDataGrid } from "ui/shared/Datagrid/CustomDataGrid";
import type { Item } from "../../shared/types";
import { useConstCallback } from "powerhooks/useConstCallback";
import { assert } from "tsafe/assert";
import { useEvt } from "evt/hooks";
import type { NonPostableEvt } from "evt";
import { useConst } from "powerhooks/useConst";

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

    onDeleteItem: (params: { item: Item }) => void;
    onCopyPath: (params: { basename: string }) => void;
    evtAction: NonPostableEvt<
        "DELETE SELECTED ITEM" | "COPY SELECTED ITEM PATH" //TODO: Delete, legacy from secret explorer
    >;
};

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
        onSelectedItemKindValueChange
    } = props;

    const { classes, cx } = useStyles();

    const selectedItemRef = useConst(() => ({
        current: id<Item | { basename: undefined; kind: "none" }>({
            basename: undefined,
            kind: "none"
        })
    }));

    const rows = useMemo(
        () =>
            items.map(
                (item, index) =>
                    ({
                        ...item,
                        id: index // Maybe a better id is necessary due to pagination
                    }) satisfies Item & { id: number }
            ),
        [items]
    );

    const columns: GridColDef[] = useMemo(
        () =>
            [
                {
                    field: "basename",
                    headerName: "Name",
                    type: "string",
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
                    type: "number",
                    align: "left",
                    headerAlign: "left",
                    valueFormatter: size => {
                        if (size === undefined) return "";
                        const prettySize = fileSizePrettyPrint({
                            bytes: size
                        });
                        return `${prettySize.value} ${prettySize.unit}`;
                    }
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
                    field: "policy",
                    headerName: "Policy",
                    display: "flex" as const,
                    type: "singleSelect",
                    valueOptions: ["public", "private"],
                    renderCell: params => (
                        <Icon
                            icon={id<MuiIconComponentName>(
                                (() => {
                                    switch (params.value) {
                                        case "public":
                                            return "Visibility";
                                        case "private":
                                            return "VisibilityOff";
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

    useEvt(
        ctx =>
            evtAction.attach(ctx, action => {
                switch (action) {
                    case "DELETE SELECTED ITEM":
                        assert(selectedItemRef.current.kind !== "none");
                        onDeleteItem({ "item": selectedItemRef.current });
                        break;
                    case "COPY SELECTED ITEM PATH":
                        assert(selectedItemRef.current.kind !== "none");
                        onCopyPath({
                            "basename": selectedItemRef.current.basename
                        });
                        break;
                }
            }),
        [evtAction, onDeleteItem, onCopyPath]
    );

    useEffectOnValueChange(() => {
        selectedItemRef.current = { basename: undefined, kind: "none" };
    }, [isNavigating]);

    const handleRowClick = useConstCallback((params: GridRowParams) => {
        if (
            !selectedItemRef.current ||
            selectedItemRef.current.kind !== params.row.kind
        ) {
            onSelectedItemKindValueChange({
                selectedItemKind: params.row.kind
            });
        }
        selectedItemRef.current = params.row;
    });

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
                loading={isNavigating}
                slotProps={{
                    loadingOverlay: {
                        variant: "linear-progress",
                        noRowsVariant: "linear-progress"
                    }
                }}
                onRowClick={handleRowClick}
                onCellDoubleClick={params => {
                    if (params.field !== "basename") return;
                    switch (params.row.kind) {
                        case "directory":
                            return onNavigate({ "basename": params.row.basename });

                        case "file":
                            return onOpenFile({ "basename": params.row.basename });
                    }
                }}
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
        "overflow": "hidden"
    },
    "nameIcon": {
        "width": "30px",
        "height": "30px",
        "marginRight": theme.spacing(2),
        "flexShrink": 0
    }
}));
