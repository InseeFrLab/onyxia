import { useState } from "react";
import { Typography } from "@mui/material";
import { tss } from "tss";
import { useConstCallback } from "powerhooks/useConstCallback";

type Props = {
    label: string;
    width: number;
    onResize: (params: { newWidth: number }) => void;
};

export function ResizableColumnHeader(props: Props) {
    const { label, width, onResize: onResize_props } = props;

    const [isResizing, setIsResizing] = useState(false);

    const { classes } = useStyles({ isResizing });

    const onResize = useConstCallback(onResize_props);

    const onMouseDown = (event: { clientX: number }) => {
        const initialX = event.clientX;
        const initialWidth = width;

        setIsResizing(true);

        const onMouseMove = (event: MouseEvent) => {
            const widthDelta = event.clientX - initialX;
            onResize({ "newWidth": initialWidth + widthDelta });
        };

        const onMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    return (
        <div className={classes.root} onMouseDown={onMouseDown}>
            <Typography variant="subtitle1">{label}</Typography>
            <div
                className={classes.resizeHandle}
                role="slider"
                aria-label="Column resize handle"
                aria-valuenow={width}
            />
        </div>
    );
}

const useStyles = tss
    .withParams<{ isResizing: boolean }>()
    .withNestedSelectors<"resizeHandle">()
    .create(({ theme, isResizing, classes }) => ({
        "root": {
            "width": "100%",
            "display": "flex",
            "alignItems": "center",
            [`&:hover .${classes.resizeHandle}`]: {
                "backgroundColor": theme.colors.useCases.typography.textFocus
            }
        },
        "resizeHandle": {
            "outline": "none",
            "width": theme.spacing(1),
            "height": theme.typography.rootFontSizePx * 1.2,
            "backgroundColor": theme.colors.useCases.typography.textDisabled,
            "cursor": "ew-resize",
            "position": "absolute",
            "right": 0,
            ...(!isResizing
                ? undefined
                : {
                      "backgroundColor": theme.colors.useCases.typography.textFocus,
                      "height": theme.typography.rootFontSizePx * 1.6
                  })
        }
    }));
