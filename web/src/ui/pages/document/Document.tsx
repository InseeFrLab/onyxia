import { LocalizedMarkdown } from "ui/shared/Markdown";
import { tss } from "tss";
import { useRoute } from "ui/routes";
import { routeGroup } from "./route";
import { assert } from "tsafe";

export type Props = {
    className?: string;
};

export default function Document(props: Props) {
    const { className } = props;

    const route = useRoute();
    assert(routeGroup.has(route));

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
