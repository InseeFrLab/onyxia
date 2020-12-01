

import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import { HomeIcon } from "./HomeIcon";
import { TourIcon } from "./TourIcon";
import { ProfileIcon } from "./ProfileIcon";
import { BashIcon } from "./BashIcon";
import { FormationIcon } from "./FormationIcon";
import { CollabToolIcon } from "./CollabToolIcon";
import { ServicesIcon } from "./ServicesIcon";
import { LabIcon } from "./LabIcon";
import { FilesIcon } from "./FilesIcon";
import { SecretsIcon } from "./SecretsIcon";
import { InfoIcon } from "./InfoIcon";



const useStyles = makeStyles(theme =>
    createStyles({
        "root": {
            "& > svg": {
                "margin": theme.spacing(2)
            }
        }
    })
);


export function IconsPreview() {

    const classes = useStyles();

    return (
        <>
            <div className={classes.root}>
                <HomeIcon />
                <HomeIcon color="primary" />
                <HomeIcon color="secondary" />
                <HomeIcon color="action" />
                <HomeIcon color="disabled" />
                <HomeIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <TourIcon />
                <TourIcon color="primary" />
                <TourIcon color="secondary" />
                <TourIcon color="action" />
                <TourIcon color="disabled" />
                <TourIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <ProfileIcon />
                <ProfileIcon color="primary" />
                <ProfileIcon color="secondary" />
                <ProfileIcon color="action" />
                <ProfileIcon color="disabled" />
                <ProfileIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <BashIcon />
                <BashIcon color="primary" />
                <BashIcon color="secondary" />
                <BashIcon color="action" />
                <BashIcon color="disabled" />
                <BashIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <FormationIcon />
                <FormationIcon color="primary" />
                <FormationIcon color="secondary" />
                <FormationIcon color="action" />
                <FormationIcon color="disabled" />
                <FormationIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <CollabToolIcon />
                <CollabToolIcon color="primary" />
                <CollabToolIcon color="secondary" />
                <CollabToolIcon color="action" />
                <CollabToolIcon color="disabled" />
                <CollabToolIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <ServicesIcon />
                <ServicesIcon color="primary" />
                <ServicesIcon color="secondary" />
                <ServicesIcon color="action" />
                <ServicesIcon color="disabled" />
                <ServicesIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <LabIcon />
                <LabIcon color="primary" />
                <LabIcon color="secondary" />
                <LabIcon color="action" />
                <LabIcon color="disabled" />
                <LabIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <FilesIcon />
                <FilesIcon color="primary" />
                <FilesIcon color="secondary" />
                <FilesIcon color="action" />
                <FilesIcon color="disabled" />
                <FilesIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <SecretsIcon />
                <SecretsIcon color="primary" />
                <SecretsIcon color="secondary" />
                <SecretsIcon color="action" />
                <SecretsIcon color="disabled" />
                <SecretsIcon style={{ "color": green[500] }} />
            </div>
            <div className={classes.root}>
                <InfoIcon />
                <InfoIcon color="primary" />
                <InfoIcon color="secondary" />
                <InfoIcon color="action" />
                <InfoIcon color="disabled" />
                <InfoIcon style={{ "color": green[500] }} />
            </div>
        </>
    );
}