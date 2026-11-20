import {
    AcknowledgeSharingOfConfigConfirmDialog,
    type Props as AcknowledgeSharingOfConfigConfirmDialogProps
} from "./AcknowledgeSharingOfConfigConfirmDialog";
import {
    AutoLaunchDisabledDialog,
    type Props as AutoLaunchDisabledDialogProps
} from "./AutoLaunchDisabledDialog";
import {
    GitCredentialsErrorDialog,
    type Props as GitCredentialsErrorDialogProps
} from "./GitCredentialsErrorDialog";
import {
    NoLongerBookmarkedDialog,
    type Props as NoLongerBookmarkedDialogProps
} from "./NoLongerBookmarkedDialog";

export type Props = {
    evtAcknowledgeSharingOfConfigConfirmDialogOpen: AcknowledgeSharingOfConfigConfirmDialogProps["evtOpen"];
    evtAutoLaunchDisabledDialogOpen: AutoLaunchDisabledDialogProps["evtOpen"];
    evtNoLongerBookmarkedDialogOpen: NoLongerBookmarkedDialogProps["evtOpen"];
    evtGitCredentialsErrorDialogOpen: GitCredentialsErrorDialogProps["evtOpen"];
};

export function LauncherDialogs(props: Props) {
    const {
        evtAcknowledgeSharingOfConfigConfirmDialogOpen,
        evtAutoLaunchDisabledDialogOpen,
        evtNoLongerBookmarkedDialogOpen,
        evtGitCredentialsErrorDialogOpen
    } = props;

    return (
        <>
            <AcknowledgeSharingOfConfigConfirmDialog
                evtOpen={evtAcknowledgeSharingOfConfigConfirmDialogOpen}
            />
            <AutoLaunchDisabledDialog evtOpen={evtAutoLaunchDisabledDialogOpen} />
            <NoLongerBookmarkedDialog evtOpen={evtNoLongerBookmarkedDialogOpen} />
            <GitCredentialsErrorDialog evtOpen={evtGitCredentialsErrorDialogOpen} />
        </>
    );
}
