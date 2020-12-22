
import React, { useMemo } from "react";
import { Typography } from "app/components/designSystem/Typography";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import clsx from "clsx"
import { basename as pathBasename, relative as pathRelative } from "path";
import memoize from "memoizee";

export type Props = {
    path: string;
    minDepth: number;
    callback(params: { relativePath: string }): void;
};

const useStyles = makeStyles(
    theme => createStyles({
        "clickablePortion": {
            "cursor": "pointer",
            "color": theme.palette.text.primary,
            "&:hover": {
                "color": theme.palette.primary.main
            }
        },
        "lastPortion": {
            "color": theme.palette.text.secondary,
        }
    })
);

export function PathNavigator(props: Props) {

    let { path, minDepth, callback } = props;

    const classes = useStyles();

    const onClickFactory = useMemo(
        () => memoize(
            (partialPath: string) =>
                () => callback({ "relativePath": pathRelative(path, partialPath) })
        ),
        [callback, path]
    );

    const partialPaths = useMemo(() => {

        const split = path.replace(/\/$/, "").split("/");

        return split.map((...[, i]) => {

            const isLast = i === split.length - 1;

            return {
                "partialPath": [...split].splice(0, i + 1).join("/") || "/",
                isLast,
                "isClickable": !isLast && (i >= minDepth)
            };

        });

    }, [path, minDepth]);

    return (
        <Box>{
            partialPaths.map(({ partialPath, isLast, isClickable }) =>
                <Box
                    key={partialPath}
                    onClick={!isClickable ? undefined : onClickFactory(partialPath)}
                    display="inline"
                    className={clsx({
                        [classes.clickablePortion]: isClickable,
                        [classes.lastPortion]: isLast
                    })}
                >
                    <Box clone display="inline">
                        <Typography color="inherit">{pathBasename(partialPath)}</Typography>
                    </Box>
                    {!isLast &&
                        <Box clone display="inline">
                            <Typography color="inherit"> / </Typography>
                        </Box>
                    }
                </Box>
            )
        }</Box>
    );

}