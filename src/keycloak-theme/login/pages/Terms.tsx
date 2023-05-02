import { useRerenderOnStateChange } from "evt/hooks";
import { Markdown } from "keycloakify/tools/Markdown";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { evtTermMarkdown } from "keycloakify/login/lib/useDownloadTerms";
import type { KcContext } from "../kcContext";
import type { I18n } from "../i18n";
import { useDownloadTerms } from "keycloakify/login";
import { createResolveLocalizedString } from "i18nifty";
import { THERMS_OF_SERVICES } from "../envCarriedOverToKc";
import { makeStyles, Button } from "ui/theme";

export default function Terms(
    props: PageProps<Extract<KcContext, { pageId: "terms.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes: props_classes } = props;

    const { msgStr } = i18n;

    // NOTE: If you aren't going to customize the layout of the page you can move this hook to
    // KcApp.tsx, see: https://docs.keycloakify.dev/terms-and-conditions
    useDownloadTerms({
        kcContext,
        "downloadTermMarkdown": async ({ currentLanguageTag }) => {
            if (THERMS_OF_SERVICES === undefined) {
                return "No terms provided";
            }

            const { resolveLocalizedString } = createResolveLocalizedString({
                "currentLanguage": currentLanguageTag,
                "fallbackLanguage": "en"
            });

            const tos_url = resolveLocalizedString(THERMS_OF_SERVICES);

            const markdownString = await fetch(tos_url).then(response => response.text());

            return markdownString;
        }
    });

    useRerenderOnStateChange(evtTermMarkdown);

    const { url } = kcContext;

    const termMarkdown = evtTermMarkdown.state;

    const { classes } = useStyles();

    if (termMarkdown === undefined) {
        return null;
    }

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss }}
            classes={props_classes}
            displayMessage={false}
            headerNode={null}
            i18n={i18n}
        >
            <div className={classes.markdownWrapper}>
                {evtTermMarkdown.state && <Markdown>{evtTermMarkdown.state}</Markdown>}
            </div>
            <form className="form-actions" action={url.loginAction} method="POST">
                <div className={classes.buttonsWrapper}>
                    <Button variant="secondary" name="cancel" type="submit">
                        {msgStr("doDecline")}
                    </Button>
                    <Button
                        tabIndex={1}
                        className={classes.buttonSubmit}
                        name="accept"
                        autoFocus={true}
                        type="submit"
                    >
                        {msgStr("doAccept")}
                    </Button>
                </div>
            </form>
        </Template>
    );
}

const useStyles = makeStyles({ "name": { Terms } })(theme => ({
    "buttonsWrapper": {
        "marginTop": theme.spacing(4),
        "display": "flex",
        "justifyContent": "flex-end"
    },
    "buttonSubmit": {
        "marginLeft": theme.spacing(2)
    },
    "markdownWrapper": {
        "& a": {
            "color": theme.colors.useCases.buttons.actionActive
        },
        "& a:hover": {
            "textDecoration": "underline"
        }
    }
}));
