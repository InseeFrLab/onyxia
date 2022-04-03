import { memo } from "react";
import { useTranslation } from "ui/i18n/useTranslations";
import { makeStyles } from "ui/theme";
import { ExplorerUploadModalDropArea } from "./ExplorerUploadModalDropArea";
import type { Props as ExplorerUploadModalDropAreaProps } from "./ExplorerUploadModalDropArea";
import { ExplorerUploadProgress } from "./ExplorerUploadProgress";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "ui/theme";

export type Props = {
    className?: string;
    isOpen: boolean;
    onClose: () => void;
    filesBeingUploaded: {
        directoryPath: string;
        basename: string;
        size: number;
        uploadPercent: number;
    }[];
} & Pick<ExplorerUploadModalDropAreaProps, "onFileSelected">;

export const ExplorerUploadModal = memo((props: Props) => {
    const { isOpen, onClose, ...rest } = props;

    const { t } = useTranslation({ ExplorerUploadModal });

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={t("import files")}
            body={<ExplorerUploadModalBody {...rest} />}
            buttons={
                <Button variant="secondary" onClick={onClose}>
                    {t("minimize")}
                </Button>
            }
        />
    );
});

const { ExplorerUploadModalBody } = (() => {
    const ExplorerUploadModalBody = memo((props: Omit<Props, "isOpen" | "onClose">) => {
        const { className, onFileSelected, filesBeingUploaded } = props;

        const { classes, cx } = useStyles();

        return (
            <div className={cx(classes.root, className)}>
                <ExplorerUploadModalDropArea onFileSelected={onFileSelected} />
                {filesBeingUploaded.map(
                    ({ directoryPath, basename, size, uploadPercent }) => (
                        <ExplorerUploadProgress
                            key={`${directoryPath}\\${basename}`}
                            basename={basename}
                            percentUploaded={uploadPercent}
                            fileSize={size}
                            isFailed={false}
                        />
                    ),
                )}
            </div>
        );
    });

    const useStyles = makeStyles({ "name": { ExplorerUploadModalBody } })(() => ({
        "root": {
            "minWidth": 500,
        },
    }));

    return { ExplorerUploadModalBody };
})();

export declare namespace ExplorerUploadModal {
    export type I18nScheme = {
        "import files": undefined;
        "cancel": undefined;
        "minimize": undefined;
    };
}
