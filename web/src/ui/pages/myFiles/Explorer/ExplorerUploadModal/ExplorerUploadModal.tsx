import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { ExplorerUploadModalDropArea } from "./ExplorerUploadModalDropArea";
import type { Props as ExplorerUploadModalDropAreaProps } from "./ExplorerUploadModalDropArea";
import { ExplorerUploadProgress } from "./ExplorerUploadProgress";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { useArrayDiff } from "powerhooks/useArrayDiff";

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

    const { t } = useTranslation({ ExplorerUploadModal });

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={t("import files")}
            body={
                <ExplorerUploadModalBody
                    filesBeingUploaded={filesBeingUploaded}
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
    type Props = Pick<ExplorerUploadModalProps, "onFileSelected" | "filesBeingUploaded">;

    const ExplorerUploadModalBody = memo((props: Props) => {
        const { onFileSelected, filesBeingUploaded } = props;

        const { classes } = useStyles();

        return (
            <div className={classes.root}>
                <ExplorerUploadModalDropArea onFileSelected={onFileSelected} />
                {filesBeingUploaded.map(
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
