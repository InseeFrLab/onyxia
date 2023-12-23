import { useId } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useCoreState, useCore } from "core";

type ProjectSelectProps = {
    className?: string;
    tProject: string;
};

export function ProjectSelect(props: ProjectSelectProps) {
    const { className, tProject } = props;

    const labelId = useId();

    const { projectManagement } = useCore().functions;

    const availableProjects = useCoreState("projectManagement", "availableProjects");

    const { id: currentProjectId } = useCoreState("projectManagement", "currentProject");

    if (availableProjects.length === 1) {
        return null;
    }

    return (
        <FormControl className={className}>
            <InputLabel id={labelId}>{tProject}</InputLabel>
            <Select
                labelId={labelId}
                value={currentProjectId}
                label="Project"
                onChange={event =>
                    projectManagement.changeProject({
                        "projectId": event.target.value
                    })
                }
            >
                {availableProjects.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                        {name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
