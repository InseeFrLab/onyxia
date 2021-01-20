
// https://github.com/mui-org/material-ui/issues/22342
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useMemo, useState, useEffect } from "react";
import { Typography } from "app/components/designSystem/Typography";
import { basename as pathBasename, relative as pathRelative } from "path";
import memoize from "memoizee";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { join as pathJoin } from "path";
import { Evt } from "evt";
import { useTheme } from "@material-ui/core/styles";

export type Props = {
    path: string;
    minDepth: number;
    isNavigationDisabled: boolean;
    callback(params: { relativePath: string }): void;
    className?: string;
    evtAction: NonPostableEvt<{ action: "DISPLAY COPY FEEDBACK"; basename: string; }>;
};

export function Breadcrump(props: Props) {

    const { minDepth, isNavigationDisabled , callback, className, evtAction } = props;

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
        () => getPartialPaths({ path, minDepth, isNavigationDisabled }),
        [path, minDepth, isNavigationDisabled]
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

function getPartialPaths(params: { path: string; minDepth: number; isNavigationDisabled: boolean; }) {

    const { path, isNavigationDisabled } = params;
    let { minDepth } = params;

    const split = (() => {

        if (!/^[^./]/.test(path)) {
            return path;
        }

        if( minDepth !== 0 ){

            minDepth--;

            return path;

        }

        return `./${path}`;

    })()
        .replace(/\/$/, "").split("/");

    return split.map((...[, i]) => {

        const isLast = i === split.length - 1;

        return {
            "partialPath": [...split].splice(0, i + 1).join("/") || "/",
            isLast,
            "isClickable": isNavigationDisabled ? false : (!isLast && (i >= minDepth))
        };

    });

}

const { Section } = (() => {

    type Props = ReturnType<typeof getPartialPaths>[number] & {
        onClick: (() => void) | undefined;
        isFocused: boolean;
    };

    function Section(props: Props) {

        const { partialPath, isLast, onClick, isFocused, isClickable } = props;

        const theme = useTheme();

        const hoverFontWeight = 500;

        const text = `${pathBasename(partialPath)}${isLast ? "" : " /"}`;

        return (
            <Typography
                color={isFocused ? "focus" : isLast ? "primary" : "secondary"}
                onClick={onClick}
                css={{
                    ...(!isClickable ? {} : {
                        "&:hover": {
                            "fontWeight": hoverFontWeight,
                            "color": theme.custom.colors.useCases.typography.textPrimary
                        },
                        "&:active": {
                            "color": theme.custom.colors.useCases.typography.textFocus
                        }
                    }),
                    //"paddingRight": 5,
                    "display": "inline-flex",
                    "flexDirection": "column",	
                    "alignItems": "center",	
                    "justifyContent": "space-between",	
                    "&::after": {	
                        "content": `"${text}_"`,	
                        "height": 0,	
                        "visibility": "hidden",	
                        "overflow": "hidden",	
                        "userSelect": "none",	
                        "pointerEvents": "none",	
                        "fontWeight": hoverFontWeight,	
                        "@media speech": {	
                            "display": "none"	
                        }	                        
                    }
                }}
            >
                {text}
            </Typography>
        );

    }

    return { Section };

})();

