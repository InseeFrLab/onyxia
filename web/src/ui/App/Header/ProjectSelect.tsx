import { useId } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useCoreState, getCoreSync } from "core";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type ProjectSelectProps = {
    className?: string;
};

export function ProjectSelect(props: ProjectSelectProps) {
    const { className } = props;
    const { t } = useTranslation({ ProjectSelect });

    const labelId = useId();

    const {
        functions: { projectManagement }
    } = getCoreSync();

    const projectSelect = useCoreState("projectManagement", "projectSelect");

    if (projectSelect.options.length === 1) {
        return null;
    }

    return (
        <FormControl className={className}>
            <InputLabel id={labelId}>{t("project")}</InputLabel>
            <Select
                labelId={labelId}
                value={projectSelect.selectedOptionValue}
                label={t("project")}
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

const { i18n } = declareComponentKeys<"project">()({ ProjectSelect });
export type I18n = typeof i18n;
