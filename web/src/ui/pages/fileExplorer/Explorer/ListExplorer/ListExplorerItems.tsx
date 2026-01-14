import { memo, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ExplorerIcon, getIconIdFromExtension } from "../ExplorerIcon";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { assert } from "tsafe/assert";
import type { Item } from "../../shared/types";
import { useEvt } from "evt/hooks";
import type { NonPostableEvt } from "evt";
import { PolicySwitch } from "../PolicySwitch";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import Link from "@mui/material/Link";
import Checkbox from "@mui/material/Checkbox";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha } from "@mui/material/styles";

export type ListExplorerItemsProps = {
    className?: string;

    isNavigating: boolean;

    items: Item[];
    isBucketPolicyFeatureEnabled: boolean;
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
    onDownloadItems: (params: { items: Item[] }) => void;
    evtAction: NonPostableEvt<
        | "DELETE SELECTED ITEM"
        | "COPY SELECTED ITEM PATH"
        | "SHARE SELECTED FILE"
        | "DOWNLOAD DIRECTORY"
    >;
};

type Row = Item & { id: number };
type RowSelectionModel = Row["id"][];

const getRowKey = (row: Pick<Item, "basename" | "kind">) => `${row.kind}:${row.basename}`;

const isRowSelectable = (row: Item) => !(row.isBeingDeleted || row.isBeingCreated);

export const ListExplorerItems = memo((props: ListExplorerItemsProps) => {
    const {
        className,
        isNavigating,
        items,
        isBucketPolicyFeatureEnabled,
        onNavigate,
        onCopyPath,
        onDeleteItems,
        onOpenFile,
        onPolicyChange,
        onSelectedItemKindValueChange,
        onShare,
        evtAction,
        onDownloadItems
    } = props;

    const { classes, cx } = useStyles({ hasPolicy: isBucketPolicyFeatureEnabled });

    const { t } = useTranslation({ ListExplorerItems });
    const [rowSelectionModel, setRowSelectionModel] = useState<RowSelectionModel>([]);
    const [hiddenRowKeys, setHiddenRowKeys] = useState<Set<string>>(new Set());

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

    const visibleRows = useMemo(
        () => rows.filter(row => !hiddenRowKeys.has(getRowKey(row))),
        [rows, hiddenRowKeys]
    );

    const selectableRowIds = useMemo(
        () => visibleRows.filter(isRowSelectable).map(row => row.id),
        [visibleRows]
    );

    const selectedRows = useMemo(
        () =>
            rowSelectionModel
                .map(id => rows[id])
                .filter((row): row is Row => row !== undefined)
                .filter(row => !hiddenRowKeys.has(getRowKey(row))),
        [rowSelectionModel, rows, hiddenRowKeys]
    );

    const isAllSelected =
        selectableRowIds.length > 0 &&
        selectableRowIds.every(id => rowSelectionModel.includes(id));
    const isIndeterminate = rowSelectionModel.length > 0 && !isAllSelected;

    useEvt(
        ctx =>
            evtAction.attach(ctx, action => {
                switch (action) {
                    case "DELETE SELECTED ITEM": {
                        assert(selectedRows.length !== 0);
                        const rowsToDelete = selectedRows;

                        onDeleteItems({ items: rowsToDelete }, () => {
                            setHiddenRowKeys(prev => {
                                const next = new Set(prev);
                                rowsToDelete.forEach(row => next.add(getRowKey(row)));
                                return next;
                            });
                            setRowSelectionModel(prev =>
                                prev.filter(
                                    id => !rowsToDelete.some(row => row.id === id)
                                )
                            );
                        });
                        return;
                    }
                    case "COPY SELECTED ITEM PATH":
                        assert(selectedRows.length === 1);
                        onCopyPath({
                            basename: selectedRows[0].basename
                        });
                        return;
                    case "SHARE SELECTED FILE":
                        assert(
                            selectedRows.length === 1 && selectedRows[0].kind === "file"
                        );
                        onShare({
                            fileBasename: selectedRows[0].basename
                        });
                        return;
                    case "DOWNLOAD DIRECTORY":
                        onDownloadItems({ items: selectedRows });
                        return;
                }
            }),
        [evtAction, selectedRows, onDeleteItems, onCopyPath, onShare, onDownloadItems]
    );

    useEffect(() => {
        onSelectedItemKindValueChange({ selectedItemKind: "none" });
        setRowSelectionModel([]);
    }, [isNavigating]);

    useEffect(() => {
        setRowSelectionModel(prev => {
            const next = prev.filter(id => {
                const row = rows[id];
                return (
                    row !== undefined &&
                    !hiddenRowKeys.has(getRowKey(row)) &&
                    isRowSelectable(row)
                );
            });

            if (
                next.length === prev.length &&
                next.every((id, index) => id === prev[index])
            ) {
                return prev;
            }

            return next;
        });
    }, [rows, hiddenRowKeys]);

    useEffect(() => {
        if (selectedRows.length === 0) {
            onSelectedItemKindValueChange({ selectedItemKind: "none" });
            return;
        }

        if (selectedRows.length === 1) {
            onSelectedItemKindValueChange({
                selectedItemKind: selectedRows[0].kind
            });
            return;
        }
        onSelectedItemKindValueChange({ selectedItemKind: "multiple" });
    }, [selectedRows]);

    useEffect(() => {
        if (hiddenRowKeys.size === 0) {
            return;
        }
        setHiddenRowKeys(new Set());
    }, [items]);

    const handleSelectAllChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setRowSelectionModel(selectableRowIds);
            return;
        }
        setRowSelectionModel([]);
    };

    const handleNameAction = (row: Row) => {
        switch (row.kind) {
            case "directory":
                return onNavigate({ basename: row.basename });

            case "file":
                return onOpenFile({ basename: row.basename });
        }
    };

    return (
        <div className={cx(classes.root, className)} role="grid" aria-busy={isNavigating}>
            {isNavigating && <LinearProgress className={classes.linearProgress} />}
            <div className={classes.listFrame}>
                <div className={cx(classes.grid, classes.headerRow)} role="row">
                    <div
                        className={cx(classes.cell, classes.checkboxCell)}
                        role="columnheader"
                    >
                        <Checkbox
                            size="small"
                            checked={isAllSelected}
                            indeterminate={isIndeterminate}
                            disabled={selectableRowIds.length === 0}
                            onChange={handleSelectAllChange}
                        />
                    </div>
                    <div className={classes.cell} role="columnheader">
                        <Text typo="caption" className={classes.headerText}>
                            {t("header name")}
                        </Text>
                    </div>
                    <div
                        className={cx(classes.cell, classes.dateCell)}
                        role="columnheader"
                    >
                        <Text typo="caption" className={classes.headerText}>
                            {t("header modified date")}
                        </Text>
                    </div>
                    <div
                        className={cx(classes.cell, classes.sizeCell)}
                        role="columnheader"
                    >
                        <Text typo="caption" className={classes.headerText}>
                            {t("header size")}
                        </Text>
                    </div>
                    {isBucketPolicyFeatureEnabled && (
                        <div
                            className={cx(classes.cell, classes.policyCell)}
                            role="columnheader"
                        >
                            <Text typo="caption" className={classes.headerText}>
                                {t("header policy")}
                            </Text>
                        </div>
                    )}
                </div>
                <div className={classes.rows} role="rowgroup">
                    {visibleRows.map(row => {
                        const isSelected = rowSelectionModel.includes(row.id);
                        const isSelectable = isRowSelectable(row);
                        const fileExtension =
                            row.kind === "directory"
                                ? "directory"
                                : (row.basename.split(".").pop() ?? "");
                        const formattedDate = row.lastModified
                            ? row.lastModified.toLocaleString()
                            : "";
                        const formattedSize =
                            row.size === undefined
                                ? ""
                                : (() => {
                                      const prettySize = fileSizePrettyPrint({
                                          bytes: row.size
                                      });
                                      return `${prettySize.value} ${prettySize.unit}`;
                                  })();

                        return (
                            <div
                                key={row.id}
                                className={cx(
                                    classes.grid,
                                    classes.row,
                                    isSelected && classes.rowSelected,
                                    !isSelectable && classes.rowDisabled
                                )}
                                role="row"
                                aria-selected={isSelected}
                                tabIndex={0}
                                onClick={event => {
                                    if (!isSelectable) return;
                                    if (rowSelectionModel.includes(row.id)) return;

                                    if (event.metaKey) {
                                        setRowSelectionModel(prev =>
                                            prev.includes(row.id)
                                                ? prev
                                                : [...prev, row.id]
                                        );
                                        return;
                                    }

                                    setRowSelectionModel([row.id]);
                                }}
                                onKeyDown={event => {
                                    if (event.key !== "Enter") return;
                                    if (event.currentTarget !== event.target) return;
                                    handleNameAction(row);
                                }}
                            >
                                <div className={cx(classes.cell, classes.checkboxCell)}>
                                    {row.isBeingCreated ? (
                                        <div
                                            className={
                                                classes.circularProgressInnerWrapper
                                            }
                                        >
                                            <CircularProgress size={32} />
                                            <div className={classes.percentageWrapper}>
                                                <Text
                                                    typo="caption"
                                                    className={classes.textUploadProgress}
                                                >
                                                    {row.uploadPercent}%
                                                </Text>
                                            </div>
                                        </div>
                                    ) : (
                                        <Checkbox
                                            size="small"
                                            checked={isSelected}
                                            disabled={!isSelectable}
                                            onClick={event => event.stopPropagation()}
                                            onChange={event => {
                                                if (!isSelectable) return;
                                                const isChecked = event.target.checked;
                                                setRowSelectionModel(prev => {
                                                    if (isChecked) {
                                                        if (prev.includes(row.id))
                                                            return prev;
                                                        return [...prev, row.id];
                                                    }
                                                    return prev.filter(
                                                        id => id !== row.id
                                                    );
                                                });
                                            }}
                                        />
                                    )}
                                </div>
                                <div
                                    className={cx(classes.cell, classes.basenameCell)}
                                    onDoubleClick={() => handleNameAction(row)}
                                >
                                    <ExplorerIcon
                                        iconId={getIconIdFromExtension(fileExtension)}
                                        hasShadow={false}
                                        className={classes.nameIcon}
                                    />
                                    <Link
                                        onClick={event => {
                                            event.stopPropagation();
                                            handleNameAction(row);
                                        }}
                                        color="inherit"
                                        underline="none"
                                        className={classes.nameLink}
                                        title={row.basename}
                                    >
                                        <Text typo="label 2" className={classes.nameText}>
                                            {row.basename}
                                        </Text>
                                    </Link>
                                </div>
                                <div className={cx(classes.cell, classes.dateCell)}>
                                    <Text typo="body 2">{formattedDate}</Text>
                                </div>
                                <div className={cx(classes.cell, classes.sizeCell)}>
                                    <Text typo="body 2">{formattedSize}</Text>
                                </div>
                                {isBucketPolicyFeatureEnabled && (
                                    <div className={cx(classes.cell, classes.policyCell)}>
                                        <PolicySwitch
                                            policy={row.policy}
                                            changePolicy={event => {
                                                switch (row.policy) {
                                                    case "public":
                                                        onPolicyChange({
                                                            basename: row.basename,
                                                            policy: "private",
                                                            kind: row.kind
                                                        });
                                                        break;
                                                    case "private":
                                                        onPolicyChange({
                                                            basename: row.basename,
                                                            policy: "public",
                                                            kind: row.kind
                                                        });
                                                        break;
                                                }
                                                event.stopPropagation();
                                            }}
                                            isPolicyChanging={row.isPolicyChanging}
                                            disabled={!row.canChangePolicy}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

const { i18n } = declareComponentKeys<
    "header name" | "header modified date" | "header size" | "header policy"
>()({ ListExplorerItems });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ ListExplorerItems })
    .withParams<{ hasPolicy: boolean }>()
    .create(({ theme, hasPolicy }) => {
        const px = (value: number) => `${value}px`;
        const baseUnit = theme.typography.rootFontSizePx;
        const gridTemplateColumns = hasPolicy
            ? `${px(baseUnit * 2.5)} minmax(${px(
                  baseUnit * 12
              )}, 1fr) ${px(baseUnit * 11)} ${px(baseUnit * 6)} ${px(baseUnit * 6)}`
            : `${px(baseUnit * 2.5)} minmax(${px(
                  baseUnit * 12
              )}, 1fr) ${px(baseUnit * 11)} ${px(baseUnit * 6)}`;

        return {
            root: {
                backgroundColor: "transparent",
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                width: "100%",
                boxSizing: "border-box"
            },
            listFrame: {
                borderRadius: theme.spacing(2),
                boxShadow: theme.shadows[1],
                border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                maxHeight: "100%",
                minHeight: 0,
                width: "100%",
                boxSizing: "border-box"
            },
            grid: {
                display: "grid",
                gridTemplateColumns,
                columnGap: theme.spacing(2),
                alignItems: "center",
                minWidth: 0
            },
            headerRow: {
                padding: theme.spacing({ topBottom: 1.5, rightLeft: 2 }),
                borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
                backgroundColor: theme.colors.useCases.surfaces.surface2,
                borderTopLeftRadius: theme.spacing(2),
                borderTopRightRadius: theme.spacing(2)
            },
            headerText: {
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: theme.colors.useCases.typography.textSecondary,
                fontWeight: 600
            },
            rows: {
                display: "flex",
                flexDirection: "column",
                flex: "1 1 auto",
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden"
            },
            row: {
                padding: theme.spacing({ topBottom: 1.25, rightLeft: 2 }),
                borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                cursor: "pointer",
                transition: "background-color 120ms ease",
                "&:hover": {
                    backgroundColor: alpha(theme.colors.useCases.surfaces.surface2, 0.6)
                }
            },
            rowSelected: {
                backgroundColor: alpha(theme.colors.useCases.typography.textFocus, 0.12),
                boxShadow: `inset 0 0 0 1px ${alpha(
                    theme.colors.useCases.typography.textFocus,
                    0.35
                )}`,
                "&:hover": {
                    backgroundColor: alpha(
                        theme.colors.useCases.typography.textFocus,
                        0.16
                    )
                }
            },
            rowDisabled: {
                opacity: 0.6,
                cursor: "default",
                "&:hover": {
                    backgroundColor: "transparent"
                }
            },
            cell: {
                display: "flex",
                alignItems: "center",
                minWidth: 0
            },
            checkboxCell: {
                justifyContent: "center"
            },
            basenameCell: {
                gap: theme.spacing(1.5),
                minWidth: 0
            },
            nameIcon: {
                width: "24px",
                height: "24px",
                flexShrink: 0
            },
            nameLink: {
                minWidth: 0,
                flex: 1,
                display: "block"
            },
            nameText: {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
            },
            dateCell: {
                color: theme.colors.useCases.typography.textSecondary,
                fontVariantNumeric: "tabular-nums"
            },
            sizeCell: {
                justifyContent: "flex-end",
                color: theme.colors.useCases.typography.textSecondary,
                fontVariantNumeric: "tabular-nums"
            },
            policyCell: {
                justifyContent: "center"
            },
            circularProgressInnerWrapper: {
                position: "relative",
                display: "inline-flex"
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
            },
            linearProgress: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0
            }
        };
    });
