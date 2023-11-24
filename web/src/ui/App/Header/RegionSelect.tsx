import { useId } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useRoute } from "ui/routes";
import { useCoreState, useCore } from "core";
import { assert } from "tsafe/assert";

type Props = {
    className?: string;
    tRegion: string;
};

export function RegionSelect(props: Props) {
    const { className, tRegion } = props;

    const { deploymentRegion } = useCore().functions;
    const availableDeploymentRegionIds = useCoreState(
        "deploymentRegion",
        "availableDeploymentRegionIds"
    );
    const { id: selectedDeploymentRegionId } = useCoreState(
        "deploymentRegion",
        "selectedDeploymentRegion"
    );

    const route = useRoute();

    const onDeploymentRegionChange = useConstCallback(
        async (props: { deploymentRegionId: string }) => {
            const { deploymentRegionId } = props;

            deploymentRegion.changeDeploymentRegion({
                deploymentRegionId,
                "reload": () => {
                    window.location.reload();
                    assert(false, "never");
                }
            });
        }
    );

    const onChange = useConstCallback(async (event: SelectChangeEvent<string>) => {
        onDeploymentRegionChange({
            "deploymentRegionId": event.target.value
        });
    });

    const labelId = useId();

    if (availableDeploymentRegionIds.length === 1) {
        return null;
    }

    switch (route.name) {
        case "launcher":
            break;
        case "myFiles":
            break;
        case "mySecrets":
            break;
        case "myServices":
            break;
        default:
            return null;
    }

    return (
        <FormControl className={className}>
            <InputLabel id={labelId}>{tRegion}</InputLabel>
            <Select
                labelId={labelId}
                value={selectedDeploymentRegionId}
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
