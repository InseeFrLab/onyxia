import { Typography, Divider } from "@mui/material";
import { tss } from "tss";
import { useConstCallback } from "powerhooks/useConstCallback";

type Props = {
    label: string;
    width: number;
    onResize: (params: { newWidth: number }) => void;
};

export function ResizableColumnHeader(props: Props) {
    const { label, width, onResize: onResize_props } = props;

    const { classes } = useStyles();

    const onResize = useConstCallback(onResize_props);

    const onMouseDown = (event: { clientX: number }) => {
        const initialX = event.clientX;
        const initialWidth = width;

        const onMouseMove = (event: MouseEvent) => {
            const widthDelta = event.clientX - initialX;
            onResize({ "newWidth": initialWidth + widthDelta });
        };

        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    return (
        <div className={classes.root} onMouseDown={onMouseDown}>
            <Typography variant="subtitle1">{label}</Typography>
            <Divider orientation="vertical" className={classes.resizeHandle} />
        </div>
    );
}

const useStyles = tss
    .withNestedSelectors<"resizeHandle">()
    .create(({ theme, classes }) => ({
        "root": {
            "width": "100%",
            "display": "flex",
            "justifyContent": "space-between",
            "alignItems": "center",
            [`&:hover .${classes.resizeHandle}`]: {
                "backgroundColor": theme.colors.useCases.typography.textFocus
            }
        },
        "resizeHandle": {
            "width": theme.spacing(1),
            "height": theme.typography.rootFontSizePx,
            "backgroundColor": theme.colors.useCases.typography.textDisabled,
            "cursor": "ew-resize"
        }
    }));
