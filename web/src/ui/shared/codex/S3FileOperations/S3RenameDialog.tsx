import { useEffect, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import {
    S3DialogItemSummary,
    S3DialogTextInput,
    useS3DialogClasses
} from "ui/shared/codex/S3DialogPrimitives";

export type S3RenameDialogProps = {
    className?: string;
    isOpen: boolean;
    name: string;
    isDirectory: boolean;
    delimiter: string;
    onConfirm: (newBasename: string) => void;
    onClose: () => void;
};

export function S3RenameDialog(props: S3RenameDialogProps) {
    const { className, isOpen, name, isDirectory, delimiter, onConfirm, onClose } = props;
    const { t } = useTranslation({ S3RenameDialog });
    const { classes, cx } = useStyles();
    const dialogClasses = useS3DialogClasses();
    const [value, setValue] = useState(name);
    useEffect(() => {
        if (isOpen) setValue(name);
    }, [isOpen, name]);
    const isValid =
        value.trim() !== "" && !value.includes(delimiter) && !value.includes("/");
    const submit = () => {
        if (isValid && value !== name) onConfirm(value);
    };
    return (
        <Dialog
            className={cx(dialogClasses.paper, classes.root, className)}
            maxWidth={false}
            muiDialogClasses={{ root: dialogClasses.overlayRoot }}
            classes={{
                title: dialogClasses.title,
                body: dialogClasses.body,
                buttons: dialogClasses.buttons
            }}
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton
            title={t(isDirectory ? "rename folder" : "rename file")}
            body={
                <div className={classes.body}>
                    <S3DialogItemSummary
                        name={name}
                        icon={isDirectory ? "folder" : "object"}
                    />
                    <S3DialogTextInput
                        label={t("new name")}
                        value={value}
                        onChange={setValue}
                        autoFocus
                        error={isValid ? undefined : t("invalid name")}
                        onEnterKeyDown={submit}
                    />
                </div>
            }
            buttons={
                <>
                    <Button variant="ternary" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button onClick={submit} disabled={!isValid || value === name}>
                        {t("rename")}
                    </Button>
                </>
            }
        />
    );
}
const useStyles = tss.withName({ S3RenameDialog }).create(({ theme }) => ({
    root: { minWidth: 0 },
    body: { display: "flex", flexDirection: "column", gap: theme.spacing(3) }
}));
const { i18n } = declareComponentKeys<
    "rename folder" | "rename file" | "new name" | "invalid name" | "cancel" | "rename"
>()({ S3RenameDialog });
export type I18n = typeof i18n;
