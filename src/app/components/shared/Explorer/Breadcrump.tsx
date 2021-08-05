import { makeStyles, Text } from "app/theme";
import { useMemo, useState, useEffect, memo } from "react";
import { basename as pathBasename, relative as pathRelative } from "path";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { join as pathJoin } from "path";
import { Evt } from "evt";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { assert } from "tsafe/assert";

export type Props = {
    path: string;
    minDepth: number;
    isNavigationDisabled: boolean;
    callback(params: { relativePath: string }): void;
    evtAction: NonPostableEvt<{
        action: "DISPLAY COPY FEEDBACK";
        basename: string;
    }>;
    className?: string;
};

export const Breadcrump = memo((props: Props) => {
    const { minDepth, isNavigationDisabled, callback, className, evtAction } = props;

    const [path, setPath] = useState(props.path);

    const [isFocused, setIsFocused] = useState(false);

    //TODO: Design custom hook for that
    const [evtPropsPath] = useState(() => Evt.create<string>(props.path));
    useEffect(() => {
        evtPropsPath.state = props.path;
    });

    useEvt(
        ctx =>
            evtPropsPath.toStateless(ctx).attach(path => {
                setIsFocused(false);
                setPath(path);
            }),
        [evtPropsPath],
    );

    const evtDisplayFeedback = useEvt(
        ctx =>
            evtAction.pipe(ctx, data =>
                data.action !== "DISPLAY COPY FEEDBACK" ? null : [data],
            ),
        [evtAction],
    );

    useEvt(
        ctx =>
            evtDisplayFeedback.attach(ctx, ({ basename }) => {
                setIsFocused(true);
                setPath(pathJoin(evtPropsPath.state, basename));

                const scopedCtx = Evt.newCtx();

                const timer = setTimeout(() => {
                    scopedCtx.done();
                    setIsFocused(false);
                    setPath(evtPropsPath.state);
                }, 500);

                scopedCtx.evtDoneOrAborted.attachOnce(() => clearTimeout(timer));

                evtDisplayFeedback.attachOnce(scopedCtx, () => scopedCtx.done());
                evtPropsPath.toStateless(scopedCtx).attachOnce(() => scopedCtx.done());

                ctx.evtDoneOrAborted.attachOnce(scopedCtx, () => scopedCtx.done());
            }),
        [evtDisplayFeedback, evtPropsPath],
    );

    const onClickFactory = useCallbackFactory<[string, boolean], []>(
        ([partialPath, isClickable]) =>
            !isClickable
                ? assert(false)
                : callback({ "relativePath": pathRelative(path, partialPath) }),
    );

    const partialPaths = useMemo(
        () => getPartialPaths({ path, minDepth, isNavigationDisabled }),
        [path, minDepth, isNavigationDisabled],
    );

    return (
        <div className={className}>
            {partialPaths.map(({ isClickable, isLast, partialPath }) => (
                <Section
                    key={partialPath}
                    {...{ isClickable, isLast, partialPath, isFocused }}
                    onClick={onClickFactory(partialPath, isClickable)}
                />
            ))}
        </div>
    );
});

function getPartialPaths(params: {
    path: string;
    minDepth: number;
    isNavigationDisabled: boolean;
}) {
    const { path, isNavigationDisabled } = params;
    let { minDepth } = params;

    const split = (() => {
        if (!/^[^./]/.test(path)) {
            return path;
        }

        if (minDepth !== 0) {
            minDepth--;

            return path;
        }

        return `./${path}`;
    })()
        .replace(/\/$/, "")
        .split("/");

    return split.map((...[, i]) => {
        const isLast = i === split.length - 1;

        return {
            "partialPath": [...split].splice(0, i + 1).join("/") || "/",
            isLast,
            "isClickable": isNavigationDisabled ? false : !isLast && i >= minDepth,
        };
    });
}

const { Section } = (() => {
    type Props = ReturnType<typeof getPartialPaths>[number] & {
        onClick: (() => void) | undefined;
        isFocused: boolean;
    };

    const hoverFontWeight = 500;

    const useStyles = makeStyles<
        Pick<Props, "isClickable" | "isFocused" | "isLast"> & { text: string }
    >()((theme, { isClickable, isFocused, isLast, text }) => ({
        "root": {
            ...(!isClickable
                ? {}
                : {
                      "&:hover": {
                          "fontWeight": hoverFontWeight,
                          "color": theme.colors.useCases.typography.textPrimary,
                      },
                      "&:active": {
                          "color": theme.colors.useCases.typography.textFocus,
                      },
                  }),
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
                    "display": "none",
                },
            },
            "color":
                theme.colors.useCases.typography[
                    isFocused ? "textFocus" : isLast ? "textPrimary" : "textSecondary"
                ],
        },
    }));

    function Section(props: Props) {
        const { partialPath, isLast, onClick, isFocused, isClickable } = props;

        const text = useMemo(
            () => `${pathBasename(partialPath)}${isLast ? "" : " /"}`,
            [partialPath, isLast],
        );

        const { classes } = useStyles({ isClickable, isFocused, isLast, text });

        return (
            <Text
                typo="body 1"
                className={classes.root}
                componentProps={{
                    "onClick": isClickable ? onClick : undefined,
                }}
            >
                {text}
            </Text>
        );
    }

    return { Section };
})();
