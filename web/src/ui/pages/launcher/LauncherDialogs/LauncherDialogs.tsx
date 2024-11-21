import {
    AcknowledgeSharingOfConfigConfirmDialog,
    type Props as AcknowledgeSharingOfConfigConfirmDialogProps
} from "./AcknowledgeSharingOfConfigConfirmDialog";
import {
    AutoLaunchDisabledDialog,
    type Props as AutoLaunchDisabledDialogProps
} from "./AutoLaunchDisabledDialog";
import {
    NoLongerBookmarkedDialog,
    type Props as NoLongerBookmarkedDialogProps
} from "./NoLongerBookmarkedDialog";

export type Props = {
    evtAcknowledgeSharingOfConfigConfirmDialogOpen: AcknowledgeSharingOfConfigConfirmDialogProps["evtOpen"];
    evtAutoLaunchDisabledDialogOpen: AutoLaunchDisabledDialogProps["evtOpen"];
    evtNoLongerBookmarkedDialogOpen: NoLongerBookmarkedDialogProps["evtOpen"];
};

export function LauncherDialogs(props: Props) {
    const {
        evtAcknowledgeSharingOfConfigConfirmDialogOpen,
        evtAutoLaunchDisabledDialogOpen,
        evtNoLongerBookmarkedDialogOpen
    } = props;

    return (
        <>
            <AcknowledgeSharingOfConfigConfirmDialog
                evtOpen={evtAcknowledgeSharingOfConfigConfirmDialogOpen}
            />
            <AutoLaunchDisabledDialog evtOpen={evtAutoLaunchDisabledDialogOpen} />
            <NoLongerBookmarkedDialog evtOpen={evtNoLongerBookmarkedDialogOpen} />
        </>
    );
}
