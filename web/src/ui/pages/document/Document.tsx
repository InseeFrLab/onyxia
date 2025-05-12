import { LocalizedMarkdown } from "ui/shared/Markdown";
import { tss } from "tss";
import type { PageRoute } from "./route";

export type Props = {
    className?: string;
    route: PageRoute;
};

export default function Document(props: Props) {
    const { className, route } = props;

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <LocalizedMarkdown className={classes.markdown} urlSourceOnly>
                {route.params.source}
            </LocalizedMarkdown>
        </div>
    );
}

const useStyles = tss.withName({ Document }).create(({ theme }) => ({
    root: {
        display: "flex",
        justifyContent: "center",
        height: "100%"
    },
    markdown: {
        borderRadius: theme.spacing(2),
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        maxWidth: 900,
        padding: theme.spacing(4),
        "&:hover": {
            boxShadow: theme.shadows[1]
        },
        marginBottom: theme.spacing(2),
        overflow: "auto"
    }
}));
