import { useEffect, memo } from "react";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { ExplorerUploadModalDropArea } from "./ExplorerUploadModalDropArea";
import type { Props as ExplorerUploadModalDropAreaProps } from "./ExplorerUploadModalDropArea";
import { ExplorerUploadProgress } from "./ExplorerUploadProgress";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { useArrayDiff } from "powerhooks/useArrayDiff";
import type { StatefulReadonlyEvt } from "evt";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import { declareComponentKeys } from "i18nifty";

export type ExplorerUploadModalProps = {
    isOpen: boolean;
    onClose: () => void;
    filesBeingUploaded: {
        directoryPath: string;
        basename: string;
        size: number;
        uploadPercent: number;
    }[];
} & Pick<ExplorerUploadModalDropAreaProps, "onFileSelected">;

export const ExplorerUploadModal = memo((props: ExplorerUploadModalProps) => {
    const { isOpen, onClose, filesBeingUploaded, onFileSelected } = props;

    useArrayDiff({
        array: filesBeingUploaded,
        watchFor: "deletion",
        callback: () => {
            if (filesBeingUploaded.length === 0) {
                onClose();
            }
        }
    });

    const evtFilesBeingUploaded = useConst(() => Evt.create(filesBeingUploaded));

    useEffect(() => {
        evtFilesBeingUploaded.state = filesBeingUploaded;
    }, [filesBeingUploaded]);

    return (
        <DialogWrapper
            isOpen={isOpen}
            onClose={onClose}
            evtFilesBeingUploaded={evtFilesBeingUploaded}
            onFileSelected={onFileSelected}
        />
    );
});

type DialogWrapperProps = Omit<ExplorerUploadModalProps, "filesBeingUploaded"> & {
    evtFilesBeingUploaded: StatefulReadonlyEvt<
        ExplorerUploadModalProps["filesBeingUploaded"]
    >;
};

//NOTE: Dialog can't re-render the Dialog without unmounting and recreating body and button.
// we use a stateful evt that is a constant so that this wrapper component doesn't re render
// wen filesBeingUploaded changes.
const DialogWrapper = memo((props: DialogWrapperProps) => {
    const { evtFilesBeingUploaded, isOpen, onClose, onFileSelected } = props;

    const { t } = useTranslation({ ExplorerUploadModal });

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={t("import files")}
            body={
                <ExplorerUploadModalBody
                    evtFilesBeingUploaded={evtFilesBeingUploaded}
                    onFileSelected={onFileSelected}
                />
            }
            buttons={
                <Button variant="secondary" onClick={onClose}>
                    {t("minimize")}
                </Button>
            }
        />
    );
});

const { ExplorerUploadModalBody } = (() => {
    type Props = Pick<DialogWrapperProps, "evtFilesBeingUploaded"> &
        Pick<ExplorerUploadModalProps, "onFileSelected">;

    const ExplorerUploadModalBody = memo((props: Props) => {
        const { onFileSelected, evtFilesBeingUploaded } = props;

        const { classes } = useStyles();

        useRerenderOnStateChange(evtFilesBeingUploaded);

        return (
            <div className={classes.root}>
                <ExplorerUploadModalDropArea onFileSelected={onFileSelected} />
                {evtFilesBeingUploaded.state.map(
                    ({ directoryPath, basename, size, uploadPercent }) => (
                        <ExplorerUploadProgress
                            className={classes.progress}
                            key={`${directoryPath}\\${basename}`}
                            basename={basename}
                            percentUploaded={uploadPercent}
                            fileSize={size}
                            isFailed={false}
                        />
                    )
                )}
            </div>
        );
    });

    const useStyles = tss.withName({ ExplorerUploadModalBody }).create(({ theme }) => ({
        root: {
            minWidth: 500,
            ...theme.spacing.topBottom("padding", 3)
        },
        progress: {
            marginTop: theme.spacing(4)
        }
    }));

    return { ExplorerUploadModalBody };
})();

const { i18n } = declareComponentKeys<"import files" | "cancel" | "minimize">()({
    ExplorerUploadModal
});
export type I18n = typeof i18n;
