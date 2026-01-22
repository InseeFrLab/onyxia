import {
    ConfirmCustomS3ConfigDeletionDialog,
    type Props as ConfirmCustomS3ConfigDeletionDialogProps
} from "./ConfirmCustomS3ConfigDeletionDialog";
import {
    CreateOrUpdateProfileDialog,
    type CreateOrUpdateProfileDialogProps
} from "./CreateOrUpdateProfileDialog";

export type S3ConfigDialogsProps = {
    evtConfirmCustomS3ConfigDeletionDialogOpen: ConfirmCustomS3ConfigDeletionDialogProps["evtOpen"];
    evtCreateOrUpdateProfileDialogOpen: CreateOrUpdateProfileDialogProps["evtOpen"];
};

export function S3ConfigDialogs(props: S3ConfigDialogsProps) {
    const {
        evtConfirmCustomS3ConfigDeletionDialogOpen,
        evtCreateOrUpdateProfileDialogOpen
    } = props;

    return (
        <>
            <ConfirmCustomS3ConfigDeletionDialog
                evtOpen={evtConfirmCustomS3ConfigDeletionDialogOpen}
            />
            <CreateOrUpdateProfileDialog evtOpen={evtCreateOrUpdateProfileDialogOpen} />
        </>
    );
}
