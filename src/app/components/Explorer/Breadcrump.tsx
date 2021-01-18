
import type React from "react";
import { useMemo } from "react";
import { Typography } from "app/components/designSystem/Typography";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { basename as pathBasename, relative as pathRelative } from "path";
import memoize from "memoizee";

export type Props = {
    path: string;
    minDepth: number;
    callback(params: { relativePath: string }): void;
    className?: string;
};

export function Breadcrump(props: Props) {

    const { path, minDepth, callback, className } = props;

    const onClickFactory = useMemo(
        () => memoize(
            (partialPath: string, isClickable: boolean) =>
                !isClickable ?
                    undefined :
                    (() => callback({ "relativePath": pathRelative(path, partialPath) }))
        ),
        [callback, path]
    );

    const partialPaths = useMemo(
        () => getPartialPaths({ path, minDepth }),
        [path, minDepth]
    );

    return (
        <div className={className}>
            {partialPaths.map(({ isClickable, isLast, partialPath }) => 
            <Section
                key={partialPath}
                {...{ isClickable, isLast, partialPath }}
                onClick={onClickFactory(partialPath, isClickable)}
            />
            )}
        </div>
    );

}

function getPartialPaths(params: { path: string; minDepth: number; }) {

    const { path, minDepth } = params;

    const split = path.replace(/\/$/, "").split("/");

    return split.map((...[, i]) => {

        const isLast = i === split.length - 1;

        return {
            "partialPath": [...split].splice(0, i + 1).join("/") || "/",
            isLast,
            "isClickable": !isLast && (i >= minDepth)
        };

    });

}

const { Section } = (() => {


    type Props = ReturnType<typeof getPartialPaths>[number] & {
        onClick: (()=> void) | undefined;
    };

    const useStyles = makeStyles(
        theme => {

            //See: https://css-tricks.com/bold-on-hover-without-the-layout-shift/
            //const hoverFontWeight = 500;

            return createStyles<"root", Props>({
                "root": ({ isClickable }) => ({
                    ...(!isClickable ? {} : {
                        "&:hover": {
                            //"fontWeight": hoverFontWeight,
                            "color": theme.custom.colors.useCases.typography.textPrimary
                        },
                    }),

                    "padding-right": 5,

                    "display": "inline-flex",

                    /*
                    "flexDirection": "column",
                    "alignItems": "center",
                    "justifyContent": "space-between",
                    "&::after": {
                        "content": `"${text}___"`,
                        "height": 0,
                        "visibility": "hidden",
                        "overflow": "hidden",
                        "userSelect": "none",
                        "pointerEvents": "none",
                        "fontWeight": hoverFontWeight,
                        "@media speech": {
                            "display": "none"
                        }
                    },
                    */
                    "&:active": {
                        "color": theme.custom.colors.useCases.typography.textFocus
                    }

                })
            });

        }
    );

    function Section(props: Props) {

        const { partialPath, isLast, onClick } = props;

        const classes = useStyles(props);

        return (
            <Typography
                className={classes.root}
                color={isLast ? "primary" : "secondary"}
                onClick={onClick}
            >
                {`${pathBasename(partialPath)}${isLast ? "" : " /"}`}
            </Typography>
        );

    }

    return { Section };

})();

