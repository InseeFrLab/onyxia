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

    const projectSelect = useCoreState("projectManagement", "projectSelect");

    if (projectSelect.options.length === 1) {
        return null;
    }

    return (
        <FormControl className={className}>
            <InputLabel id={labelId}>{tProject}</InputLabel>
            <Select
                labelId={labelId}
                value={projectSelect.selectedOptionValue}
                label="Project"
                onChange={event =>
                    projectManagement.changeProject({
                        projectId: event.target.value
                    })
                }
            >
                {projectSelect.options.map(({ label, value }) => (
                    <MenuItem key={value} value={value}>
                        {label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
