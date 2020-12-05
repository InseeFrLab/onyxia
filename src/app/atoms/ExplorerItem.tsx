
import React from "react";
import directorySvg from "app/assets/svg/Directory.svg";
import secretSvg from "app/assets/svg/Secret.svg";
//import secretSvg from "app/assets/svg/Home.svg";
import Typography from "@material-ui/core/Typography";
import { makeStyles, createStyles } from "@material-ui/core/styles";

export type Params = {
    /** Tell if we are displaying an directory or a secret */
    kind: "secret" | "directory";
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

export function ExplorerItem(params: Params) {

    const { kind, basename, onClick } = params;

    const classes = useStyles();

    return (
        <div className={classes.root} onClick={onClick}>
            <img
                className={classes.img}
                src={
                    (() => {
                        switch (kind) {
                            case "directory": return directorySvg;
                            case "secret": return secretSvg;
                        }
                    })()
                }
                alt="Directory icon"
            />
            <Typography>{basename}</Typography>
        </div>
    );

}