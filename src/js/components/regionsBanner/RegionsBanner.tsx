import { useState } from "react";
import Alert from "@mui/material/Alert";
import { IconButton, Collapse, Grid as Grid_v4, Button, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useHistory } from "react-router-dom";
//import { useIsBetaModeEnabled, useAppConstants, useSelectedRegion } from "ui/coreApi";

const Grid: any = Grid_v4;

const RegionBanner = () => {
    //@ts-ignore
    const appConstants = useAppConstants();
    //@ts-ignore
    const selectedRegion = useSelectedRegion();
    const regions = appConstants.isUserLoggedIn ? appConstants.regions : [];

    const [open, setOpen] = useState(true);
    const history = useHistory();
    //@ts-ignore
    const { isBetaModeEnabled } = useIsBetaModeEnabled();

    return selectedRegion && regions.length > 1 && isBetaModeEnabled ? (
        <>
            <Collapse in={open}>
                <Alert
                    variant="filled"
                    severity="success"
                    action={
                        <Button
                            aria-label="a-propos"
                            color="inherit"
                            size="small"
                            onClick={() => history.push("/about")}
                        >
                            Changer
                        </Button>
                    }
                >
                    <Typography>
                        Vous déployez dans la région {selectedRegion.name}
                    </Typography>
                </Alert>
            </Collapse>
            <Grid container direction="row" justify="flex-end" alignItems="flex-start">
                {!open ? (
                    <IconButton
                        aria-label="show"
                        color="inherit"
                        size="small"
                        onClick={() => setOpen(true)}
                    >
                        <ExpandMoreIcon fontSize="inherit" />
                    </IconButton>
                ) : (
                    <IconButton
                        aria-label="show"
                        color="inherit"
                        size="small"
                        onClick={() => setOpen(false)}
                    >
                        <ExpandLessIcon fontSize="inherit" />
                    </IconButton>
                )}
            </Grid>
        </>
    ) : (
        <></>
    );
};

export default RegionBanner;
