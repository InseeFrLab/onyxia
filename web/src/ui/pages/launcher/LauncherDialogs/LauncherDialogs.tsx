import {
    AcknowledgeSharingOfConfigConfirmDialog,
    type Props as AcknowledgeSharingOfConfigConfirmDialogProps
} from "./AcknowledgeSharingOfConfigConfirmDialog";
import {
    AutoLaunchDisabledDialog,
    type Props as AutoLaunchDisabledDialogProps
} from "./AutoLaunchDisabledDialog";
import {
    SensitiveConfigurationDialog,
    type Props as SensitiveConfigurationDialogProps
} from "./SensitiveConfigurationDialog";
import {
    NoLongerBookmarkedDialog,
    type Props as NoLongerBookmarkedDialogProps
} from "./NoLongerBookmarkedDialog";
import {
    OverwriteConfigurationConfirmDialog,
    type Props as OverwriteConfigurationConfirmDialogProps
} from "./OverwriteConfigurationConfirmDialog";

export type Props = {
    evtAcknowledgeSharingOfConfigConfirmDialogOpen: AcknowledgeSharingOfConfigConfirmDialogProps["evtOpen"];
    evtAutoLaunchDisabledDialogOpen: AutoLaunchDisabledDialogProps["evtOpen"];
    evtSensitiveConfigurationDialogOpen: SensitiveConfigurationDialogProps["evtOpen"];
    evtNoLongerBookmarkedDialogOpen: NoLongerBookmarkedDialogProps["evtOpen"];
    evtOverwriteConfigurationConfirmDialogOpen: OverwriteConfigurationConfirmDialogProps["evtOpen"];
};

export function LauncherDialogs(props: Props) {
    const {
        evtAcknowledgeSharingOfConfigConfirmDialogOpen,
        evtAutoLaunchDisabledDialogOpen,
        evtSensitiveConfigurationDialogOpen,
        evtNoLongerBookmarkedDialogOpen,
        evtOverwriteConfigurationConfirmDialogOpen
    } = props;

    return (
        <>
            <AcknowledgeSharingOfConfigConfirmDialog
                evtOpen={evtAcknowledgeSharingOfConfigConfirmDialogOpen}
            />
            <AutoLaunchDisabledDialog evtOpen={evtAutoLaunchDisabledDialogOpen} />
            <SensitiveConfigurationDialog evtOpen={evtSensitiveConfigurationDialogOpen} />
            <NoLongerBookmarkedDialog evtOpen={evtNoLongerBookmarkedDialogOpen} />
            <OverwriteConfigurationConfirmDialog
                evtOpen={evtOverwriteConfigurationConfirmDialogOpen}
            />
        </>
    );
}
