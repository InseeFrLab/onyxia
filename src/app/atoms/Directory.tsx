

import React from "react";
import { ReactComponent as DirectorySvg } from "app/assets/svg/Directory.svg";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { makeStyles, createStyles } from "@material-ui/core/styles";

export type Params = {
    /** Name displayed under the folder icon*/
    basename: string;
    /** callback invoked when the button is clicked */
    onClick: () => void;
};

const useStyles = makeStyles(
    () => createStyles({
        "root": {
            "textAlign": "center",
            "cursor": "pointer"
        }
    })
);

export function Directory(params: Params) {

    const { basename, onClick } = params;

    const classes = useStyles();

    return (
        <div className={classes.root} onClick={onClick}>
            <Box clone mb={1}>
                <DirectorySvg />
            </Box>
            <Typography>{basename}</Typography>
        </div >
    );

}