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
    evtAutoLaunchDisabledDialogOpen: AutoLaunchDisabledDialogProps["evtOpen"];
    evtSensitiveConfigurationDialogOpen: SensitiveConfigurationDialogProps["evtOpen"];
    evtNoLongerBookmarkedDialogOpen: NoLongerBookmarkedDialogProps["evtOpen"];
    evtOverwriteConfigurationConfirmDialogOpen: OverwriteConfigurationConfirmDialogProps["evtOpen"];
};

export function LauncherDialogs(props: Props) {
    const {
        evtAutoLaunchDisabledDialogOpen,
        evtSensitiveConfigurationDialogOpen,
        evtNoLongerBookmarkedDialogOpen,
        evtOverwriteConfigurationConfirmDialogOpen
    } = props;

    return (
        <>
            <AutoLaunchDisabledDialog evtOpen={evtAutoLaunchDisabledDialogOpen} />
            <SensitiveConfigurationDialog evtOpen={evtSensitiveConfigurationDialogOpen} />
            <NoLongerBookmarkedDialog evtOpen={evtNoLongerBookmarkedDialogOpen} />
            <OverwriteConfigurationConfirmDialog
                evtOpen={evtOverwriteConfigurationConfirmDialogOpen}
            />
        </>
    );
}
