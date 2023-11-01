import { useRerenderOnStateChange } from "evt/hooks";
import { Markdown } from "keycloakify/tools/Markdown";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { evtTermMarkdown } from "keycloakify/login/lib/useDownloadTerms";
import type { KcContext } from "../kcContext";
import type { I18n } from "../i18n";
import { useDownloadTerms } from "keycloakify/login";
import { createResolveLocalizedStringFactory } from "i18nifty/LocalizedString/LocalizedString";
import { TERMS_OF_SERVICES } from "../envCarriedOverToKc";
import { tss } from "keycloak-theme/login/theme";
import { Button } from "onyxia-ui/Button";
import { useConst } from "powerhooks/useConst";
import { id } from "tsafe/id";

export default function Terms(
    props: PageProps<Extract<KcContext, { pageId: "terms.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes: props_classes } = props;

    const { msgStr } = i18n;

    const refTosLang = useConst(() => ({ "current": id<string | undefined>(undefined) }));

    // NOTE: If you aren't going to customize the layout of the page you can move this hook to
    // KcApp.tsx, see: https://docs.keycloakify.dev/terms-and-conditions
    useDownloadTerms({
        kcContext,
        "downloadTermMarkdown": ({ currentLanguageTag }) =>
            downloadTermMarkdown({ currentLanguageTag }).then(
                ({ markdownString, lang }) => {
                    refTosLang.current = lang;

                    return markdownString;
                }
            )
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
            <div
                className={classes.markdownWrapper}
                lang={
                    kcContext.locale?.currentLanguageTag !== refTosLang.current
                        ? refTosLang.current
                        : undefined
                }
            >
                {evtTermMarkdown.state && <Markdown>{termMarkdown}</Markdown>}
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

const useStyles = tss.withName({ Terms }).create(({ theme }) => ({
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

const { createResolveLocalizedString } = createResolveLocalizedStringFactory({
    "createJsxElement": ({ text, lang }) => ({ text, lang })
});

export async function downloadTermMarkdown(params: { currentLanguageTag: string }) {
    const { currentLanguageTag } = params;

    if (TERMS_OF_SERVICES === undefined) {
        return { "markdownString": "No terms provided", "lang": "en" };
    }

    const { resolveLocalizedString } = createResolveLocalizedString({
        "currentLanguage": currentLanguageTag,
        "fallbackLanguage": "en",
        "labelWhenMismatchingLanguage": true
    });

    const { text: tos_url, lang } = resolveLocalizedString(TERMS_OF_SERVICES);

    const markdownString = await fetch(tos_url).then(response => response.text());

    return { markdownString, lang };
}
