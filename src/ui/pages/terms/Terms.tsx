import { useEffect, useState } from "react";
import { useSplashScreen } from "onyxia-ui";
import { Markdown } from "onyxia-ui/Markdown";
import { useLang } from "ui/i18n";
import { makeStyles } from "ui/theme";
import { downloadTermMarkdown } from "keycloak-theme/login/pages/Terms";
import type { PageRoute } from "./route";

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

    {
        const { showSplashScreen, hideSplashScreen } = useSplashScreen();

        useEffect(() => {
            if (tos !== undefined) {
                hideSplashScreen();
            } else {
                showSplashScreen({
                    "enableTransparency": false
                });
            }
        }, [tos]);
    }

    const { classes, cx } = useStyles();

    if (tos === undefined) {
        return null;
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

const useStyles = makeStyles({ "name": { Terms } })(theme => ({
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
