import { useEffect, useState } from "react";
import type { Route } from "type-route";
import { createGroup } from "type-route";
import { routes } from "ui/routes";
import { useSplashScreen } from "onyxia-ui";
import { Markdown } from "onyxia-ui/Markdown";
import { useLang } from "ui/i18n";
import { makeStyles } from "ui/theme";
import { downloadTermMarkdown } from "keycloak-theme/login/pages/Terms";

Terms.routeGroup = createGroup([routes.terms]);

type PageRoute = Route<typeof Terms.routeGroup>;

Terms.getDoRequireUserLoggedIn = () => false;

export type Props = {
    className?: string;
    route: PageRoute;
};

export function Terms(props: Props) {
    const { className } = props;

    const [tos, setTos] = useState<string | undefined>(undefined);

    const { lang } = useLang();

    useEffect(() => {
        downloadTermMarkdown({ "currentLanguageTag": lang }).then(setTos);
    }, [lang]);

    {
        const { showSplashScreen, hideSplashScreen } = useSplashScreen();

        useEffect(() => {
            if (typeof tos === "string") {
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
        <div className={cx(classes.root, className)}>
            <Markdown className={classes.markdown}>{tos}</Markdown>
        </div>
    );
}

export const useStyles = makeStyles()(theme => ({
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
