import { tss } from "tss";
import { Button } from "onyxia-ui/Button";

export type Props = {
    className?: string;
    serviceName: string;
    coverImageUrl: string;
    onClick: () => void;
};

export function HomeLS3ServiceCard(props: Props) {
    const { className, serviceName, coverImageUrl, onClick } = props;

    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <img className={classes.img} src={coverImageUrl} />
            <Button onClick={onClick}>Demarer un {serviceName}</Button>
        </div>
    );
}

const useStyles = tss.withName({ HomeLS3ServiceCard }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        padding: theme.spacing(3),
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        borderRadius: theme.spacing(2),

        boxShadow: theme.shadows[1],
        "&:hover": {
            boxShadow: theme.shadows[6]
        }
    },
    img: {
        height: 120,
        objectFit: "cover",
        borderRadius: 3
    }
}));
