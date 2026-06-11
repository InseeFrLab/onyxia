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
            <img src={coverImageUrl} />
            <Button onClick={onClick}>Demarer un {serviceName}</Button>
        </div>
    );
}

const useStyles = tss.withName({ HomeLS3ServiceCard }).create(() => ({
    root: {}
}));
