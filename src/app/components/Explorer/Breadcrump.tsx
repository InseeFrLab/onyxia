
import type React from "react";
import { useMemo, useState, useEffect } from "react";
import { Typography } from "app/components/designSystem/Typography";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { basename as pathBasename, relative as pathRelative } from "path";
import memoize from "memoizee";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { join as pathJoin } from "path";
import { Evt } from "evt";

export type Props = {
    path: string;
    minDepth: number;
    callback(params: { relativePath: string }): void;
    className?: string;
    evtAction: NonPostableEvt<{ action: "DISPLAY COPY FEEDBACK"; basename: string; }>;
};

export function Breadcrump(props: Props) {

    const { minDepth, callback, className, evtAction } = props;

    const [path, setPath] = useState(props.path);


    const [isFocused, setIsFocused]= useState(false);

    //TODO: Design custom hook for that
    const [evtPropsPath] = useState(() => Evt.create<string>(props.path));
    useEffect(() => { evtPropsPath.state = props.path });

    useEvt(ctx =>
        evtPropsPath.toStateless(ctx).attach(path=> {
            setIsFocused(false);
            setPath(path);
        }),
        [evtPropsPath]
    );

    const evtDisplayFeedback = useEvt(
        ctx => evtAction.pipe(
            ctx,
            data => data.action !== "DISPLAY COPY FEEDBACK" ?
                null : [data]
        ),
        [evtAction]
    );

    useEvt(
        ctx => evtDisplayFeedback.attach(
            ctx,
            ({ basename }) => {

                setIsFocused(true);
                setPath(pathJoin(evtPropsPath.state, basename));

                const scopedCtx = Evt.newCtx();

                const timer = setTimeout(() => {
                    scopedCtx.done();
                    setIsFocused(false);
                    setPath(evtPropsPath.state)
                }, 500);

                scopedCtx.evtDoneOrAborted.attachOnce(() => clearTimeout(timer));

                evtDisplayFeedback.attachOnce(scopedCtx, () => scopedCtx.done()); 
                evtPropsPath.toStateless(scopedCtx).attachOnce(() => scopedCtx.done());

                ctx.evtDoneOrAborted.attachOnce(scopedCtx, () => scopedCtx.done());

            }
        ),
        [
            evtDisplayFeedback,
            evtPropsPath
        ]
    );

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
                    {...{ isClickable, isLast, partialPath, isFocused }}
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
        onClick: (() => void) | undefined;
        isFocused: boolean;
    };

    //Failed attempt for bold on hover (refresh bug): https://css-tricks.com/bold-on-hover-without-the-layout-shift/
    const useStyles = makeStyles(
        theme => createStyles<"root", Props>({
            "root": ({ isClickable }) => ({
                ...(!isClickable ? {} : {
                    "&:hover": {
                        "color": theme.custom.colors.useCases.typography.textPrimary,
                        "&:active": {
                            "color": theme.custom.colors.useCases.typography.textFocus
                        }
                    },
                }),
                "padding-right": 5,
                "display": "inline-flex",
            })
        })
    );

    function Section(props: Props) {

        const { partialPath, isLast, onClick, isFocused } = props;

        const classes = useStyles(props);

        return (
            <Typography
                className={classes.root}
                color={isFocused ? "focus" : isLast ? "primary" : "secondary"}
                onClick={onClick}
            >
                {`${pathBasename(partialPath)}${isLast ? "" : " /"}`}
            </Typography>
        );

    }

    return { Section };

})();

