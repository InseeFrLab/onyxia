import { useEffect, useState } from "react";
import { Markdown } from "ui/shared/Markdown";
import { useLang } from "ui/i18n";
import { tss } from "tss";
import { downloadTermMarkdown } from "keycloak-theme/login/pages/Terms";
import type { PageRoute } from "./route";
import { CircularProgress } from "onyxia-ui/CircularProgress";

export type Props = {
    className?: string;
    route: PageRoute;
};

export default function Terms(props: Props) {
    const { className } = props;

    const [tos, setTos] = useState<
        { markdownString: string; lang: string | undefined } | undefined
    >(undefined);

    const { lang } = useLang();

    useEffect(() => {
        downloadTermMarkdown({ "currentLanguageTag": lang }).then(setTos);
    }, [lang]);

    const { classes, cx } = useStyles();

    if (tos === undefined) {
        return <CircularProgress />;
    }

    return (
        <div
            className={cx(classes.root, className)}
            lang={lang !== tos.lang ? tos.lang : undefined}
        >
            <Markdown className={classes.markdown}>{tos.markdownString}</Markdown>
        </div>
    );
}

const useStyles = tss.withName({ Terms }).create(({ theme }) => ({
    "root": {
        "display": "flex",
        "justifyContent": "center",
        "height": "100%"
    },
    "markdown": {
        "borderRadius": theme.spacing(2),
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "maxWidth": 900,
        "padding": theme.spacing(4),
        "&:hover": {
            "boxShadow": theme.shadows[1]
        },
        "marginBottom": theme.spacing(2),
        "overflow": "auto"
    }
}));
