import { useId } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import { useCoreState, useCore } from "core";
import { assert } from "tsafe/assert";

type Props = {
    className?: string;
    tRegion: string;
};

export function RegionSelect(props: Props) {
    const { className, tRegion } = props;

    const { deploymentRegionManagement } = useCore().functions;
    const availableDeploymentRegionIds = useCoreState(
        "deploymentRegionManagement",
        "availableDeploymentRegionIds"
    );
    const { id: currentDeploymentRegionId } = useCoreState(
        "deploymentRegionManagement",
        "currentDeploymentRegion"
    );

    const onDeploymentRegionChange = useConstCallback(
        async (props: { deploymentRegionId: string }) => {
            const { deploymentRegionId } = props;

            deploymentRegionManagement.changeDeploymentRegion({
                deploymentRegionId,
                reload: () => {
                    window.location.reload();
                    assert(false, "never");
                }
            });
        }
    );

    const onChange = useConstCallback(async (event: SelectChangeEvent<string>) => {
        onDeploymentRegionChange({
            deploymentRegionId: event.target.value
        });
    });

    const labelId = useId();

    if (availableDeploymentRegionIds.length === 1) {
        return null;
    }

    return (
        <FormControl className={className}>
            <InputLabel id={labelId}>{tRegion}</InputLabel>
            <Select
                labelId={labelId}
                value={currentDeploymentRegionId}
                label={tRegion}
                onChange={onChange}
            >
                {availableDeploymentRegionIds.map(deploymentRegionId => (
                    <MenuItem key={deploymentRegionId} value={deploymentRegionId}>
                        {deploymentRegionId}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
