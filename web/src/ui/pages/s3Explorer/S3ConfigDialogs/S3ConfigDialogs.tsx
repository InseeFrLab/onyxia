import {
    ConfirmCustomS3ConfigDeletionDialog,
    type Props as ConfirmCustomS3ConfigDeletionDialogProps
} from "./ConfirmCustomS3ConfigDeletionDialog";
import {
    AddCustomS3ConfigDialog,
    type AddCustomS3ConfigDialogProps
} from "./AddCustomS3ConfigDialog";

export type S3ConfigDialogsProps = {
    evtConfirmCustomS3ConfigDeletionDialogOpen: ConfirmCustomS3ConfigDeletionDialogProps["evtOpen"];
    evtAddCustomS3ConfigDialogOpen: AddCustomS3ConfigDialogProps["evtOpen"];
};

export function S3ConfigDialogs(props: S3ConfigDialogsProps) {
    const { evtConfirmCustomS3ConfigDeletionDialogOpen, evtAddCustomS3ConfigDialogOpen } =
        props;

    return (
        <>
            <ConfirmCustomS3ConfigDeletionDialog
                evtOpen={evtConfirmCustomS3ConfigDeletionDialogOpen}
            />
            <AddCustomS3ConfigDialog evtOpen={evtAddCustomS3ConfigDialogOpen} />
        </>
    );
}
