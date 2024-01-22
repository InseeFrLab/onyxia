import {
    ConfirmCustomS3ConfigDeletionDialog,
    type Props as ConfirmCustomS3ConfigDeletionDialogProps
} from "./ConfirmCustomS3ConfigDeletionDialog";
import {
    AddCustomS3ConfigDialog,
    type Props as AddCustomS3ConfigDialogProps
} from "./AddCustomS3ConfigDialog";

export type Props = {
    evtConfirmCustomS3ConfigDeletionDialogOpen: ConfirmCustomS3ConfigDeletionDialogProps["evtOpen"];
    evtAddCustomS3ConfigDialogOpen: AddCustomS3ConfigDialogProps["evtOpen"];
};

export function S3ConfigDialogs(props: Props) {
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
