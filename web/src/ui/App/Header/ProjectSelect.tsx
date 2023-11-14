import { useId, useEffect } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useRoute } from "ui/routes";
import { useCoreFunctions, useCoreState } from "core";
import { useSplashScreen } from "onyxia-ui";

type ProjectSelectProps = {
    className?: string;
    tProject: string;
};

export function ProjectSelect(props: ProjectSelectProps) {
    const { className, tProject } = props;

    const onChange = useConstCallback(async (event: SelectChangeEvent<string>) => {
        onSelectedProjectChange({
            "projectId": event.target.value
        });
    });

    const labelId = useId();

    const { projectConfigs, userAuthentication } = useCoreFunctions();
    const projectsState = useCoreState(state =>
        !userAuthentication.getIsUserLoggedIn() ? undefined : state.projectConfigs
    );

    const route = useRoute();

    {
        const { isOnboarding } = projectsState ?? {};

        const { showSplashScreen, hideSplashScreen } = useSplashScreen({
            "minimumDisplayDuration": 200
        });

        useEffect(() => {
            if (isOnboarding === undefined) {
                return;
            }

            if (isOnboarding) {
                showSplashScreen({
                    "enableTransparency": true
                });
            } else {
                hideSplashScreen();
            }
        }, [isOnboarding]);
    }

    const onSelectedProjectChange = useConstCallback(
        async (props: { projectId: string }) => {
            const { projectId } = props;

            //TODO: This should be handled by the core
            const reload = (() => {
                switch (route.name) {
                    case "home":
                    case "account":
                    case "myServices":
                    case "myFiles":
                    case "mySecrets":
                        return undefined;
                    default:
                        return () => window.location.reload();
                }
            })();

            await projectConfigs.changeProject({
                projectId,
                "doPreventDispatch": reload !== undefined
            });

            reload?.();
        }
    );

    if (projectsState === undefined) {
        return null;
    }

    const { projects, selectedProjectId } = projectsState;

    if (projects.length === 1) {
        return null;
    }

    return (
        <FormControl className={className}>
            <InputLabel id={labelId}>{tProject}</InputLabel>
            <Select
                labelId={labelId}
                value={selectedProjectId}
                label="Project"
                onChange={onChange}
            >
                {projects.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                        {name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
