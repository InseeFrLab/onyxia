import {
    ConfirmCustomS3ConfigDeletionDialog,
    type Props as ConfirmCustomS3ConfigDeletionDialogProps
} from "./ConfirmCustomS3ConfigDeletionDialog";
import { S3ProfileDialog, type S3ProfileDialogProps } from "./S3ProfileDialog";
import {
    ConfirmBucketCreationAttemptDialog,
    type ConfirmBucketCreationAttemptDialogProps
} from "./ConfirmBucketCreationAttemptDialog";
import {
    ConfirmOverwriteDialog,
    type ConfirmOverwriteDialogProps
} from "./ConfirmOverwriteDialog";
import {
    CreateOrRenameBookmarkDialog,
    type CreateOrRenameBookmarkDialogProps
} from "./CreateOrRenameBookmarkDialog";
import {
    DirectoryCreationDialog,
    type DirectoryCreationDialogProps
} from "./DirectoryCreationDialog";
import { DisplayErrorDialog, type DisplayErrorDialogProps } from "./DisplayErrorDialog";
import {
    S3ShareObjectDialog,
    type S3ShareObjectDialogProps
} from "./S3ShareObjectDialog";
import {
    MaybeAcknowledgeConfigVolatilityDialog,
    type MaybeAcknowledgeConfigVolatilityDialogProps
} from "ui/shared/MaybeAcknowledgeConfigVolatilityDialog";

export type S3ExplorerDialogsProps = {
    evtConfirmCustomS3ConfigDeletionDialogOpen: ConfirmCustomS3ConfigDeletionDialogProps["evtOpen"];
    evtS3ProfileDialogOpen: S3ProfileDialogProps["evtOpen"];
    evtConfirmBucketCreationAttemptDialogOpen: ConfirmBucketCreationAttemptDialogProps["evtOpen"];
    evtConfirmOverwriteDialogOpen: ConfirmOverwriteDialogProps["evtOpen"];
    evtCreateOrRenameBookmarkDialogOpen: CreateOrRenameBookmarkDialogProps["evtOpen"];
    evtDirectoryCreationDialogOpen: DirectoryCreationDialogProps["evtOpen"];
    evtDisplayErrorDialogOpen: DisplayErrorDialogProps["evtOpen"];
    evtS3ShareObjectDialogOpen: S3ShareObjectDialogProps["evtOpen"];
    evtMaybeAcknowledgeConfigVolatilityDialogOpen: MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"];
};

export function S3ExplorerDialogs(props: S3ExplorerDialogsProps) {
    const {
        evtConfirmCustomS3ConfigDeletionDialogOpen,
        evtS3ProfileDialogOpen,
        evtConfirmBucketCreationAttemptDialogOpen,
        evtConfirmOverwriteDialogOpen,
        evtCreateOrRenameBookmarkDialogOpen,
        evtDirectoryCreationDialogOpen,
        evtDisplayErrorDialogOpen,
        evtS3ShareObjectDialogOpen,
        evtMaybeAcknowledgeConfigVolatilityDialogOpen
    } = props;

    return (
        <>
            <ConfirmCustomS3ConfigDeletionDialog
                evtOpen={evtConfirmCustomS3ConfigDeletionDialogOpen}
            />
            <S3ProfileDialog evtOpen={evtS3ProfileDialogOpen} />
            <ConfirmBucketCreationAttemptDialog
                evtOpen={evtConfirmBucketCreationAttemptDialogOpen}
            />
            <ConfirmOverwriteDialog evtOpen={evtConfirmOverwriteDialogOpen} />
            <CreateOrRenameBookmarkDialog evtOpen={evtCreateOrRenameBookmarkDialogOpen} />
            <DirectoryCreationDialog evtOpen={evtDirectoryCreationDialogOpen} />
            <DisplayErrorDialog evtOpen={evtDisplayErrorDialogOpen} />
            <S3ShareObjectDialog evtOpen={evtS3ShareObjectDialogOpen} />
            <MaybeAcknowledgeConfigVolatilityDialog
                evtOpen={evtMaybeAcknowledgeConfigVolatilityDialogOpen}
            />
        </>
    );
}
