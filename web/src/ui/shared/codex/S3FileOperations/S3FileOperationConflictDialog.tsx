import { useEffect, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import {
    S3DialogItemSummary,
    useS3DialogClasses
} from "ui/shared/codex/S3DialogPrimitives";

export type S3FileOperationConflictDialogProps = {
    className?: string;
    isOpen: boolean;
    /** Changes for every question, including consecutive conflicts with the same destination. */
    questionId: string;
    kind: "directory" | "object";
    operation: "copy" | "move" | "rename";
    name: string;
    source: string;
    destination: string;
    onResolve: (response: S3FileOperationConflictDialogProps.Response) => void;
};

export namespace S3FileOperationConflictDialogProps {
    export type Response = Response.Proceed | Response.Skip | Response.Cancel;
    export namespace Response {
        type Common = { doRememberChoice: boolean };
        export type Proceed = Common & { action: "proceed" };
        export type Skip = Common & { action: "skip" };
        export type Cancel = { action: "cancel" };
    }
}

export function S3FileOperationConflictDialog(props: S3FileOperationConflictDialogProps) {
    const {
        className,
        isOpen,
        questionId,
        kind,
        operation,
        name,
        source,
        destination,
        onResolve
    } = props;
    const { t } = useTranslation({ S3FileOperationConflictDialog });
    const { classes, cx } = useStyles();
    const dialogClasses = useS3DialogClasses();
    const [doRememberChoice, setDoRememberChoice] = useState(false);
    useEffect(() => setDoRememberChoice(false), [questionId]);
    return (
        <Dialog
            className={cx(dialogClasses.paper, classes.root, className)}
            maxWidth={false}
            muiDialogClasses={{ root: dialogClasses.overlayRoot }}
            classes={{
                title: dialogClasses.title,
                body: dialogClasses.body,
                buttons: classes.buttons
            }}
            isOpen={isOpen}
            onClose={() => onResolve({ action: "cancel" })}
            showCloseButton
            title={t(kind === "directory" ? "directory exists" : "object exists")}
            body={
                <div className={classes.body}>
                    <S3DialogItemSummary
                        name={name}
                        icon={kind === "directory" ? "folder" : "object"}
                    />
                    <p>
                        {t(
                            kind === "directory"
                                ? "merge explanation"
                                : "overwrite explanation"
                        )}
                    </p>
                    <dl className={classes.paths}>
                        <dt>{t("source")}</dt>
                        <dd>{source}</dd>
                        <dt>{t("destination")}</dt>
                        <dd>{destination}</dd>
                    </dl>
                    {(operation === "move" || operation === "rename") && (
                        <p>{t("skipped sources remain")}</p>
                    )}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={doRememberChoice}
                                onChange={event =>
                                    setDoRememberChoice(event.target.checked)
                                }
                            />
                        }
                        label={t(
                            kind === "directory"
                                ? "remember directories"
                                : "remember objects"
                        )}
                    />
                </div>
            }
            buttons={
                <>
                    <Button
                        variant="ternary"
                        onClick={() => onResolve({ action: "cancel" })}
                    >
                        {t("cancel all")}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => onResolve({ action: "skip", doRememberChoice })}
                    >
                        {t("skip")}
                    </Button>
                    <Button
                        onClick={() => onResolve({ action: "proceed", doRememberChoice })}
                    >
                        {t(kind === "directory" ? "merge" : "overwrite")}
                    </Button>
                </>
            }
        />
    );
}
const useStyles = tss.withName({ S3FileOperationConflictDialog }).create(({ theme }) => ({
    root: { minWidth: 0 },
    body: { "& p": { margin: `${theme.spacing(2)}px 0` } },
    paths: {
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr)",
        gap: theme.spacing(2),
        "& dt": { fontWeight: 600 },
        "& dd": { margin: 0, overflowWrap: "anywhere", fontFamily: "monospace" }
    },
    buttons: {
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(1),
        justifyContent: "flex-end",
        marginTop: theme.spacing(3)
    }
}));
const { i18n } = declareComponentKeys<
    | "directory exists"
    | "object exists"
    | "merge explanation"
    | "overwrite explanation"
    | "source"
    | "destination"
    | "skipped sources remain"
    | "remember directories"
    | "remember objects"
    | "cancel all"
    | "skip"
    | "merge"
    | "overwrite"
>()({ S3FileOperationConflictDialog });
export type I18n = typeof i18n;
