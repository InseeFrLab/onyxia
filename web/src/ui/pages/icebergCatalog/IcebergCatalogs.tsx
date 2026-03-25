import { useMemo, useState } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Collapse from "@mui/material/Collapse";
import { type GridColDef } from "@mui/x-data-grid";
import { CustomDataGrid, autosizeOptions } from "ui/shared/Datagrid/CustomDataGrid";
import type { CatalogView, SelectedTableView } from "core/usecases/icebergCatalog";

export type Props = {
    className?: string;
    catalogs: CatalogView[];
    isLoading: boolean;
    selectedTable: SelectedTableView | undefined;
    onSelectTable: (params: {
        catalog: string;
        namespace: string;
        table: string;
    }) => void;
};

export function IcebergCatalogs(props: Props) {
    const { className, catalogs, isLoading, selectedTable, onSelectTable } = props;
    const { classes, cx } = useStyles();

    if (isLoading) {
        return (
            <div className={cx(classes.emptyState, className)}>
                <CircularProgress size={48} />
            </div>
        );
    }

    if (catalogs.length === 0) {
        return (
            <div className={cx(classes.emptyState, className)}>
                <Icon icon={getIconUrlByName("Storage")} className={classes.emptyIcon} />
                <Text typo="object heading">No catalog available</Text>
                <Text typo="body 1" color="secondary">
                    No Iceberg catalog is configured for this region.
                </Text>
            </div>
        );
    }

    return (
        <div className={cx(classes.root, className)}>
            {catalogs.map(catalog => (
                <CatalogCard
                    key={catalog.name}
                    catalog={catalog}
                    selectedTable={selectedTable}
                    onSelectTable={onSelectTable}
                />
            ))}
        </div>
    );
}

function shortenUrl(url: string): string {
    try {
        const { hostname, pathname } = new URL(url);
        return hostname + (pathname !== "/" ? pathname : "");
    } catch {
        return url;
    }
}

function CatalogCard(props: {
    catalog: CatalogView;
    selectedTable: SelectedTableView | undefined;
    onSelectTable: Props["onSelectTable"];
}) {
    const { catalog, selectedTable, onSelectTable } = props;
    const { classes } = useStyles();
    const totalTables = catalog.namespaces.reduce((sum, ns) => sum + ns.tables.length, 0);

    return (
        <div className={classes.catalogCard}>
            <div className={classes.catalogHeader}>
                <div className={classes.catalogIconWrapper}>
                    <Icon
                        icon={getIconUrlByName("Storage")}
                        className={classes.catalogIcon}
                    />
                </div>
                <div className={classes.catalogTitleGroup}>
                    <Text typo="object heading">{catalog.name}</Text>
                    <div className={classes.catalogMeta}>
                        <Tooltip title={catalog.warehouse}>
                            <span className={classes.metaText}>{catalog.warehouse}</span>
                        </Tooltip>
                        <span className={classes.metaSep}>·</span>
                        <Tooltip title={catalog.endpoint}>
                            <span className={classes.metaText}>
                                {shortenUrl(catalog.endpoint)}
                            </span>
                        </Tooltip>
                    </div>
                </div>
                <div className={classes.catalogBadges}>
                    <span className={classes.badge}>
                        {catalog.namespaces.length}&nbsp;namespace
                        {catalog.namespaces.length !== 1 ? "s" : ""}
                    </span>
                    <span className={classes.badge}>
                        {totalTables}&nbsp;table{totalTables !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>
            <div className={classes.namespaceList}>
                {catalog.namespaces.length === 0 ? (
                    <div className={classes.emptyInner}>
                        <Text typo="body 2" color="secondary">
                            No namespaces found.
                        </Text>
                    </div>
                ) : (
                    catalog.namespaces.map(ns => (
                        <NamespaceSection
                            key={ns.name}
                            namespace={ns}
                            catalogName={catalog.name}
                            selectedTable={selectedTable}
                            onSelectTable={onSelectTable}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function NamespaceSection(props: {
    namespace: CatalogView["namespaces"][number];
    catalogName: string;
    selectedTable: SelectedTableView | undefined;
    onSelectTable: Props["onSelectTable"];
}) {
    const { namespace, catalogName, selectedTable, onSelectTable } = props;
    const [open, setOpen] = useState(true);
    const { classes, cx } = useStyles();

    return (
        <div className={classes.namespaceSection}>
            <button
                type="button"
                className={classes.namespaceHeader}
                onClick={() => setOpen(v => !v)}
            >
                <Icon
                    icon={getIconUrlByName(open ? "FolderOpen" : "Folder")}
                    className={classes.nsIcon}
                />
                <Text typo="label 1">{namespace.name}</Text>
                <span className={classes.nsCountBadge}>{namespace.tables.length}</span>
                <span className={classes.nsSpacer} />
                <Icon
                    icon={getIconUrlByName("ChevronRight")}
                    className={cx(classes.nsChevron, open && classes.nsChevronOpen)}
                />
            </button>
            <Collapse in={open} unmountOnExit>
                <div className={classes.tableList}>
                    {namespace.tables.length === 0 ? (
                        <div className={classes.emptyTables}>
                            <Text typo="body 2" color="secondary">
                                No tables in this namespace.
                            </Text>
                        </div>
                    ) : (
                        namespace.tables.map(table => (
                            <TableRow
                                key={table.name}
                                table={table}
                                catalogName={catalogName}
                                namespaceName={namespace.name}
                                selectedTable={selectedTable}
                                onSelectTable={onSelectTable}
                            />
                        ))
                    )}
                </div>
            </Collapse>
        </div>
    );
}

function TableRow(props: {
    table: CatalogView["namespaces"][number]["tables"][number];
    catalogName: string;
    namespaceName: string;
    selectedTable: SelectedTableView | undefined;
    onSelectTable: Props["onSelectTable"];
}) {
    const { table, catalogName, namespaceName, selectedTable, onSelectTable } = props;
    const { classes, cx } = useStyles();

    const isSelected =
        selectedTable?.catalog === catalogName &&
        selectedTable.namespace === namespaceName &&
        selectedTable.table === table.name;

    return (
        <>
            <div
                className={cx(classes.tableRow, isSelected && classes.tableRowSelected)}
                onClick={() =>
                    onSelectTable({
                        catalog: catalogName,
                        namespace: namespaceName,
                        table: table.name
                    })
                }
            >
                <Icon
                    icon={getIconUrlByName("TableChart")}
                    className={classes.tableIcon}
                />
                <Text typo="body 1" className={classes.tableName}>
                    {table.name}
                </Text>
            </div>
            <Collapse in={isSelected} unmountOnExit>
                {isSelected && selectedTable !== undefined && (
                    <TablePreviewPanel selectedTable={selectedTable} />
                )}
            </Collapse>
        </>
    );
}

function TablePreviewPanel(props: { selectedTable: SelectedTableView }) {
    const { selectedTable } = props;
    const { classes } = useStyles();

    const columns = useMemo<GridColDef[]>(
        () =>
            selectedTable.columns.map(col => ({
                field: col.name,
                headerName: col.name,
                description: col.rawType,
                flex: 1,
                minWidth: 100,
                sortable: false
            })),
        [selectedTable.columns]
    );

    const rows = useMemo(
        () => selectedTable.rows.map((row, i) => ({ ...row, _id: i })),
        [selectedTable.rows]
    );

    return (
        <div className={classes.previewPanel}>
            {selectedTable.isLoading ? (
                <div className={classes.previewLoading}>
                    <CircularProgress size={24} />
                </div>
            ) : (
                <CustomDataGrid
                    className={classes.previewGrid}
                    density="compact"
                    columns={columns}
                    rows={rows}
                    getRowId={row => row._id as number}
                    hideFooter
                    disableColumnMenu
                    autoHeight
                    autosizeOnMount
                    autosizeOptions={autosizeOptions}
                />
            )}
        </div>
    );
}

const useStyles = tss.withName({ IcebergCatalogs }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3)
    },
    emptyState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing(2),
        padding: theme.spacing(10),
        opacity: 0.6,
        textAlign: "center"
    },
    emptyIcon: {
        fontSize: "3rem",
        marginBottom: theme.spacing(1)
    },
    // ── Catalog card ──────────────────────────────────────────────────────
    catalogCard: {
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[1]
    },
    catalogHeader: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(3),
        padding: theme.spacing({ topBottom: 3, rightLeft: 4 }),
        borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`
    },
    catalogIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },
    catalogIcon: {
        fontSize: "1.3rem",
        color: theme.colors.useCases.typography.textSecondary
    },
    catalogTitleGroup: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    catalogMeta: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        flexWrap: "wrap"
    },
    metaText: {
        fontFamily: "monospace",
        fontSize: "0.72rem",
        color: theme.colors.useCases.typography.textSecondary,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        padding: "2px 8px",
        borderRadius: 4,
        maxWidth: 280,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "default"
    },
    metaSep: {
        color: theme.colors.useCases.typography.textDisabled,
        fontSize: "0.75rem",
        userSelect: "none"
    },
    catalogBadges: {
        display: "flex",
        gap: theme.spacing(1),
        flexShrink: 0
    },
    badge: {
        fontSize: "0.72rem",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 20,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textSecondary,
        whiteSpace: "nowrap"
    },
    // ── Namespace sections ────────────────────────────────────────────────
    namespaceList: {},
    emptyInner: {
        padding: `${theme.spacing(3)} ${theme.spacing(4)}`
    },
    namespaceSection: {
        borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        "&:last-child": { borderBottom: "none" }
    },
    namespaceHeader: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        width: "100%",
        padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
        transition: "background-color 0.15s",
        "&:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        }
    },
    nsIcon: {
        fontSize: "1.1rem",
        color: theme.colors.useCases.typography.textSecondary,
        flexShrink: 0
    },
    nsCountBadge: {
        fontSize: "0.68rem",
        fontWeight: 600,
        padding: "1px 7px",
        borderRadius: 20,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textSecondary
    },
    nsSpacer: { flex: 1 },
    nsChevron: {
        fontSize: "1rem",
        color: theme.colors.useCases.typography.textDisabled,
        transition: "transform 0.2s ease",
        flexShrink: 0
    },
    nsChevronOpen: {
        transform: "rotate(90deg)"
    },
    // ── Table rows ────────────────────────────────────────────────────────
    tableList: {
        marginLeft: `calc(${theme.spacing(4)} + 8px)`,
        paddingLeft: theme.spacing(3),
        paddingBottom: theme.spacing(1),
        borderLeft: `2px solid ${theme.colors.useCases.typography.textTertiary}`
    },
    emptyTables: {
        padding: `${theme.spacing(2)} 0`
    },
    tableRow: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        padding: `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(1)} 0`,
        cursor: "pointer",
        borderRadius: 6,
        transition: "background-color 0.15s",
        "&::before": {
            content: '""',
            position: "absolute",
            left: `calc(-1 * ${theme.spacing(3)})`,
            top: "50%",
            transform: "translateY(-50%)",
            width: `calc(${theme.spacing(3)} - 2px)`,
            height: 2,
            backgroundColor: theme.colors.useCases.typography.textTertiary
        },
        "&:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        }
    },
    tableRowSelected: {
        backgroundColor: `${theme.colors.useCases.typography.textFocus}11`,
        "&:hover": {
            backgroundColor: `${theme.colors.useCases.typography.textFocus}1a`
        }
    },
    tableIcon: {
        fontSize: "1rem",
        color: theme.colors.useCases.typography.textSecondary,
        flexShrink: 0
    },
    tableName: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    // ── Inline preview panel ──────────────────────────────────────────────
    previewPanel: {
        marginLeft: `-${theme.spacing(3)}`,
        borderTop: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        marginBottom: theme.spacing(1)
    },
    previewLoading: {
        display: "flex",
        justifyContent: "center",
        padding: theme.spacing(3)
    },
    previewGrid: {
        border: "none",
        borderRadius: 0,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        fontSize: "0.8rem"
    }
}));
