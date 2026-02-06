import {
    ConfirmCustomS3ConfigDeletionDialog,
    type Props as ConfirmCustomS3ConfigDeletionDialogProps
} from "./ConfirmCustomS3ConfigDeletionDialog";
import {
    CreateOrUpdateProfileDialog,
    type CreateOrUpdateProfileDialogProps
} from "./CreateOrUpdateProfileDialog";
import {
    ConfirmBucketCreationAttemptDialog,
    type ConfirmBucketCreationAttemptDialogProps
} from "./ConfirmBucketCreationAttemptDialog";
import {
    MaybeAcknowledgeConfigVolatilityDialog,
    type MaybeAcknowledgeConfigVolatilityDialogProps
} from "ui/shared/MaybeAcknowledgeConfigVolatilityDialog";

export type S3ExplorerDialogsProps = {
    evtConfirmCustomS3ConfigDeletionDialogOpen: ConfirmCustomS3ConfigDeletionDialogProps["evtOpen"];
    evtCreateOrUpdateProfileDialogOpen: CreateOrUpdateProfileDialogProps["evtOpen"];
    evtConfirmBucketCreationAttemptDialogOpen: ConfirmBucketCreationAttemptDialogProps["evtOpen"];
    evtMaybeAcknowledgeConfigVolatilityDialogOpen: MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"];
};

export function S3ExplorerDialogs(props: S3ExplorerDialogsProps) {
    const {
        evtConfirmCustomS3ConfigDeletionDialogOpen,
        evtCreateOrUpdateProfileDialogOpen,
        evtConfirmBucketCreationAttemptDialogOpen,
        evtMaybeAcknowledgeConfigVolatilityDialogOpen
    } = props;

    return (
        <>
            <ConfirmCustomS3ConfigDeletionDialog
                evtOpen={evtConfirmCustomS3ConfigDeletionDialogOpen}
            />
            <CreateOrUpdateProfileDialog evtOpen={evtCreateOrUpdateProfileDialogOpen} />
            <ConfirmBucketCreationAttemptDialog
                evtOpen={evtConfirmBucketCreationAttemptDialogOpen}
            />
            <MaybeAcknowledgeConfigVolatilityDialog
                evtOpen={evtMaybeAcknowledgeConfigVolatilityDialogOpen}
            />
        </>
    );
}
