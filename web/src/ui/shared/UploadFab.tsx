import Fab from "@mui/material/Fab";
import CircularProgress from "@mui/material/CircularProgress";
import UploadIcon from "@mui/icons-material/Upload";
import { tss } from "tss-react/mui";
import { useDomRect } from "powerhooks/useDomRect";

type Props = {
    className?: string;
    onClick: () => void;
};

export function UploadFab({ className, onClick }: Props) {
    const { ref, domRect } = useDomRect<HTMLButtonElement>();

    const fabSize = domRect.width;

    const progressSize = fabSize + 12;

    const offset = (progressSize - fabSize) / 2;

    const { classes, cx } = useStyles({ offset });

    return (
        <div className={cx(classes.root, className)}>
            <Fab ref={ref} color="primary" aria-label="upload" onClick={onClick}>
                <UploadIcon />
            </Fab>
            <CircularProgress size={progressSize} className={classes.progress} />
        </div>
    );
}

const useStyles = tss.withParams<{ offset: number }>().create(({ offset }) => ({
    root: {
        position: "relative"
    },
    progress: {
        position: "absolute",
        top: -offset,
        left: -offset
    }
}));
