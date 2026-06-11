import { tss } from "tss";
import { useState, useId } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Button } from "onyxia-ui/Button";
import { routes } from "ui/routes";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import { id } from "tsafe";
import { useCoreState } from "core";
import { Alert } from "onyxia-ui/Alert";
import Link from "@mui/material/Link";
import { TextField } from "onyxia-ui/TextField";
import { Text } from "onyxia-ui/Text";
import { PUBLIC_URL } from "env";

const services = ["RStudio", "Jupyter", "VSCode"] as const;

type Service = (typeof services)[number];

const { useGitRepositoryUrl } = createUseGlobalState({
    doPersistAcrossReloads: true,
    initialState: id<undefined | string>(undefined),
    name: "gitRepositoryUrl"
});

export function HomeLS3() {
    const { classes } = useStyles();

    const [service, setService] = useState<Service>("RStudio");

    const labelId = useId();

    const { gitRepositoryUrl, setGitRepositoryUrl } = useGitRepositoryUrl();

    const { githubPersonalAccessToken } = useCoreState("userConfigs", "userConfigs");
    const { user } = useCoreState("userAuthentication", "main");

    return (
        <div className={classes.root}>
            {user !== undefined && (
                <Text typo="page heading">Bienvenu {user.firstName}</Text>
            )}
            <FormControl fullWidth>
                <InputLabel id={labelId}>Service</InputLabel>
                <Select
                    labelId={labelId}
                    value={service}
                    onChange={event => setService(event.target.value as Service)}
                >
                    {services.map(service => (
                        <MenuItem key={service} value={service}>
                            {service}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {!githubPersonalAccessToken ? (
                <Alert severity="info">
                    Pour integrer GIT, lire ça:
                    <Link
                        {...routes.document({
                            source: `${PUBLIC_URL}/custom-resources-example/ls3/git-tutorial.md`
                        }).link}
                    >
                        Tutoriel GIT
                    </Link>
                </Alert>
            ) : (
                <>
                    <TextField
                        label="Git Repository"
                        defaultValue={gitRepositoryUrl}
                        onSubmit={gitRepositoryUrl =>
                            setGitRepositoryUrl(gitRepositoryUrl)
                        }
                    />
                </>
            )}

            <Button
                {...routes.launcher({
                    catalogId: "ide",
                    chartName: (() => {
                        switch (service) {
                            case "Jupyter":
                                return "jupyter-python";
                            case "RStudio":
                                return "rstudio";
                            case "VSCode":
                                return "vscode-python";
                        }
                    })(),
                    helmValuesPatch:
                        gitRepositoryUrl === undefined
                            ? undefined
                            : [
                                  {
                                      path: ["git", "repository"],
                                      value: "https://github.com/InseeFrLab/onyxia"
                                  }
                              ],
                    autoLaunch: true
                }).link}
            >
                Launch {service}
            </Button>
        </div>
    );
}

const useStyles = tss.withName({ HomeLS3 }).create(() => ({
    root: {
        height: "100%"
    }
}));
