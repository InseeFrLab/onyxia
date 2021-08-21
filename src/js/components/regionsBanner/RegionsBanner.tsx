import { useState } from "react";
import Alert from "@material-ui/core/Alert";
import {
    IconButton,
    Collapse,
    Grid as Grid_v4,
    Button,
    Typography,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import { useHistory } from "react-router-dom";
import {
    useIsBetaModeEnabled,
    useAppConstants,
    useSelectedRegion,
} from "app/interfaceWithLib/hooks";

const Grid: any = Grid_v4;

const RegionBanner = () => {
    const appConstants = useAppConstants();
    const selectedRegion = useSelectedRegion();
    const regions = appConstants.isUserLoggedIn ? appConstants.regions : [];

    const [open, setOpen] = useState(true);
    const history = useHistory();
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
