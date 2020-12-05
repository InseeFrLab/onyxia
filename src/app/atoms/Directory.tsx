
import React from "react";
import directorySvg from "app/assets/svg/Directory.svg";
import Typography from "@material-ui/core/Typography";
import { makeStyles, createStyles } from "@material-ui/core/styles";

export type Params = {
    /** Name displayed under the folder icon*/
    basename: string;
    /** callback invoked when the button is clicked */
    onClick: () => void;
};


const useStyles = makeStyles(
    theme => createStyles({
        "root": {
            "textAlign": "center",
            "cursor": "pointer"
        },
        "img": {
            "marginBottom": theme.spacing(1),
            "height": "auto",
            "width": theme.spacing(5),
            [theme.breakpoints.up("md")]: {
                "width": theme.spacing(7)
            }
        }

    })
);

export function Directory(params: Params) {

    const { basename, onClick } = params;

    const classes = useStyles();

    return (
        <div className={classes.root} onClick={onClick}>
            <img className={classes.img} src={directorySvg} alt="Directory icon" />
            <Typography>{basename}</Typography>
        </div >
    );

}