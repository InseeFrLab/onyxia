import { useEffect, useState } from "react";
import { declareComponentKeys } from "i18nifty";
import type { Route } from "type-route";
import { createGroup } from "type-route";
import { routes } from "ui/routes";
import { useSplashScreen } from "onyxia-ui";
import { Markdown } from "onyxia-ui/Markdown";
import { useLang, useTranslation } from "ui/i18n";
import { Text } from "ui/theme";
import { makeStyles } from "ui/theme";
import { getTosMarkdownUrl } from "ui/components/KcApp/getTosMarkdownUrl";

Terms.routeGroup = createGroup([routes.terms]);

type PageRoute = Route<typeof Terms.routeGroup>;

Terms.getDoRequireUserLoggedIn = () => false;

export type Props = {
    className?: string;
    route: PageRoute;
};

export function Terms(props: Props) {
    const { className } = props;

    const { tosUrl } = (function useClosure() {
        const { lang } = useLang();
        const tosUrl = getTosMarkdownUrl(lang);
        return { tosUrl };
    })();

    const [tos, setTos] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (tosUrl === undefined) {
            return;
        }

        fetch(tosUrl)
            .then(res => res.text())
            .then(setTos);
    }, [tosUrl]);

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

    const { t } = useTranslation({ Terms });

    const { classes, cx } = useStyles();

    if (tosUrl === undefined) {
        return <Text typo="display heading">{t("no terms")}</Text>;
    }

    if (tos === undefined) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <Markdown className={classes.markdown}>{tos}</Markdown>
        </div>
    );
}

export const { i18n } = declareComponentKeys<"no terms">()({
    Terms
});

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
