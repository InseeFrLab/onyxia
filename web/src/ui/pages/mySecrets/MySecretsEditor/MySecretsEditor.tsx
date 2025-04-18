/* eslint-disable react-refresh/only-export-components */
import { tss } from "tss";
import { useMemo, useState, memo } from "react";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { SecretWithMetadata, Secret } from "core/ports/SecretsManager";
import type { EditSecretParams } from "core/usecases/secretsEditor";
import memoize from "memoizee";
import { useTranslation } from "ui/i18n";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "tsafe/assert";
import {
    MySecretsEditorRow,
    type MySecretsEditorRowProps as RowProps
} from "./MySecretsEditorRow";
import { useArrayDiff } from "powerhooks/useArrayDiff";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";
import {
    generateUniqDefaultName,
    buildNameFactory
} from "ui/tools/generateUniqDefaultName";
import type { Id } from "tsafe/id";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import { Dialog } from "onyxia-ui/Dialog";
import { declareComponentKeys } from "i18nifty";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    isBeingUpdated: boolean;
    secretWithMetadata: SecretWithMetadata;
    onEdit(params: EditSecretParams): void;
    onCopyPath(): void;
    doDisplayUseInServiceDialog: boolean;
    onDoDisplayUseInServiceDialogValueChange(doDisplayUseInServiceDialog: boolean): void;
};

export const MySecretsEditor = memo((props: Props) => {
    const {
        secretWithMetadata,
        onEdit,
        isBeingUpdated,
        onCopyPath,
        doDisplayUseInServiceDialog,
        onDoDisplayUseInServiceDialogValueChange
    } = props;

    const { secret } = secretWithMetadata;

    const { t } = useTranslation({ MySecretsEditor });

    const getEvtAction = useMemo(
        () => memoize((_key: string) => Evt.create<UnpackEvt<RowProps["evtAction"]>>()),
        []
    );

    // When an row is created automatically enter editing mode.
    useArrayDiff({
        watchFor: "addition or deletion",
        array: Object.keys(secret),
        callback: ({ added, removed }) => {
            if (
                !(added.length === 1 && removed.length === 0 && secret[added[0]] === "")
            ) {
                return;
            }

            const [key] = added;

            getEvtAction(key).post("ENTER EDITING STATE");
        }
    });

    const onEditFactory = useMemo(
        () =>
            memoize(
                (key: string) =>
                    ({ editedKey, editedStrValue }: Parameters<RowProps["onEdit"]>[0]) =>
                        onEdit(
                            (() => {
                                if (
                                    editedKey !== undefined &&
                                    editedStrValue !== undefined
                                ) {
                                    return {
                                        action: "renameKeyAndUpdateValue" as const,
                                        key,
                                        newKey: editedKey,
                                        newValue: editedStrValue
                                    };
                                }

                                if (editedStrValue !== undefined) {
                                    return {
                                        action: "addOrOverwriteKeyValue" as const,
                                        key,
                                        value: editedStrValue
                                    };
                                }

                                if (editedKey !== undefined) {
                                    return {
                                        action: "renameKey" as const,
                                        key,
                                        newKey: editedKey
                                    };
                                }

                                assert(false);
                            })()
                        )
            ),
        [onEdit]
    );

    const onDeleteFactory = useMemo(
        () =>
            memoize(
                (key: string) => () =>
                    onEdit({
                        action: "removeKeyValue",
                        key
                    })
            ),
        [onEdit]
    );

    const getIsValidAndAvailableKeyFactory = useMemo(
        () =>
            memoize(
                (key: string) =>
                    ({
                        key: candidateKey
                    }: Parameters<RowProps["getIsValidAndAvailableKey"]>[0]) => {
                        {
                            const getIsValidKeyResult = getIsValidKey({
                                key: candidateKey
                            });

                            if (!getIsValidKeyResult.isValidKey) {
                                return {
                                    isValidAndAvailableKey: false,
                                    message: t(getIsValidKeyResult.message)
                                } as const;
                            }
                        }

                        if (
                            Object.keys(secret)
                                .filter(k => k !== key)
                                .includes(candidateKey)
                        ) {
                            return {
                                isValidAndAvailableKey: false,
                                message: t("unavailable key")
                            } as const;
                        }

                        return { isValidAndAvailableKey: true } as const;
                    }
            ),
        [secret, t]
    );

    const onClick = useConstCallback(() =>
        onEdit({
            action: "addOrOverwriteKeyValue",
            key: generateUniqDefaultName({
                names: Object.keys(secret),
                buildName: buildNameFactory({
                    defaultName: t("environnement variable default name"),
                    separator: "_"
                })
            }),
            value: ""
        })
    );

    const { classes } = useStyles(props);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const dialogCallbackFactory = useCallbackFactory(([action]: ["open" | "close"]) => {
        const isActionOpenDialog = (() => {
            switch (action) {
                case "open":
                    return true;
                case "close":
                    return false;
            }
        })();

        onEditorRowStartEditFactory("")();

        if (isActionOpenDialog) {
            onCopyPath();
        }

        if (!doDisplayUseInServiceDialog && isActionOpenDialog) {
            return;
        }

        setIsDialogOpen(isActionOpenDialog);
    });

    const onEditorRowStartEditFactory = useCallbackFactory(([key]: [string]) =>
        Object.keys(secret)
            .filter(key_i => key_i !== key)
            .map(key => getEvtAction(key).post("SUBMIT EDIT"))
    );

    return (
        <div className={classes.root}>
            <TableContainer className={classes.tableContainerRoot}>
                <Table aria-label={t("table of secret")}>
                    <TableHead className={classes.tableHead}>
                        <TableRow>
                            <TableCell>
                                <Text typo="body 1">$</Text>
                            </TableCell>
                            <TableCell>
                                <Text typo="body 1">{t("key column name")}</Text>
                            </TableCell>

                            <TableCell>
                                <Text typo="body 1">{t("value column name")}</Text>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.keys(secret).map((key, i) => (
                            <MySecretsEditorRow
                                key={key}
                                keyOfSecret={key}
                                strValue={stringifyValue(secret[key])}
                                isLocked={isBeingUpdated}
                                onEdit={onEditFactory(key)}
                                onDelete={onDeleteFactory(key)}
                                getIsValidAndAvailableKey={getIsValidAndAvailableKeyFactory(
                                    key
                                )}
                                evtAction={getEvtAction(key)}
                                isDarker={i % 2 === 1}
                                onStartEdit={onEditorRowStartEditFactory(key)}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <div className={classes.buttonWrapper}>
                <Button startIcon={getIconUrlByName("Add")} onClick={onClick}>
                    {t("add an entry")}
                </Button>
                <Button
                    onClick={dialogCallbackFactory("open")}
                    variant="secondary"
                    startIcon={getIconUrlByName("FilterNone")}
                >
                    {t("use this secret")}
                </Button>
                <Dialog
                    title={t("use secret dialog title")}
                    subtitle={t("use secret dialog subtitle")}
                    body={t("use secret dialog body")}
                    isOpen={isDialogOpen}
                    onClose={dialogCallbackFactory("close")}
                    onDoShowNextTimeValueChange={onDoDisplayUseInServiceDialogValueChange}
                    buttons={
                        <Button onClick={dialogCallbackFactory("close")}>
                            {t("use secret dialog ok")}
                        </Button>
                    }
                    doNotShowNextTimeText={t("do not display again")}
                />
            </div>
        </div>
    );
});

const { i18n } = declareComponentKeys<
    | "add an entry"
    | "environnement variable default name"
    | "table of secret"
    | "key column name"
    | "value column name"
    | "unavailable key"
    | "invalid key empty string"
    | "invalid key _ not valid"
    | "invalid key start with digit"
    | "invalid key invalid character"
    | "use this secret"
    | "use secret dialog title"
    | "use secret dialog subtitle"
    | "use secret dialog body"
    | "use secret dialog ok"
    | "do not display again"
>()({ MySecretsEditor });
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<Props>()
    .withName({ MySecretsEditor })
    .create(({ theme }) => ({
        root: {
            padding: theme.spacing(3),
            "& .MuiTableCell-root": {
                padding: 0,
                border: "unset"
            },
            "& .MuiTableHead-root": {
                borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`
            },
            //So the error on the input of the last row is not cropped.
            overflow: "visible"
        },
        tableHead: {
            "& .MuiTypography-root": {
                padding: theme.spacing({ topBottom: 3, rightLeft: 2 })
            }
        },
        buttonWrapper: {
            marginTop: theme.spacing(4),
            display: "inline-flex",
            gap: theme.spacing(2)
        },
        tableContainerRoot: {
            overflow: "visible"
        }
    }));

function stringifyValue(value: Secret.Value) {
    return typeof value === "object" ? JSON.stringify(value) : `${value}`;
}

//const TableContainerComponent = withProps(Paper, { "elevation": 3 });

/** Exported for storybook */
export function getIsValidKey(params: { key: string }):
    | {
          isValidKey: true;
      }
    | {
          isValidKey: false;
          message: Id<
              (typeof i18n)[number],
              | "invalid key _ not valid"
              | "invalid key start with digit"
              | "invalid key invalid character"
              | "invalid key empty string"
          >;
      } {
    const { key } = params;

    if (key === "") {
        return {
            isValidKey: false,
            message: "invalid key empty string"
        };
    }

    if (key === "_") {
        return {
            isValidKey: false,
            message: "invalid key _ not valid"
        };
    }

    if (/^[0-9]/.test(key)) {
        return {
            isValidKey: false,
            message: "invalid key start with digit"
        };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        return {
            isValidKey: false,
            message: "invalid key invalid character"
        };
    }

    return { isValidKey: true };
}
