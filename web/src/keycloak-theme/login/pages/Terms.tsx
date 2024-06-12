import { Markdown } from "onyxia-ui/Markdown";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { useTermsMarkdown } from "keycloakify/login/lib/useDownloadTerms";

export default function Terms(
    props: PageProps<Extract<KcContext, { pageId: "terms.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes: props_classes } = props;

    const { msgStr } = i18n;

    const { isDownloadComplete, termsLanguageTag, termsMarkdown } = useTermsMarkdown();

    const { url } = kcContext;

    const { classes } = useStyles();

    if (!isDownloadComplete) {
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
                    kcContext.locale?.currentLanguageTag !== termsLanguageTag
                        ? termsLanguageTag
                        : undefined
                }
            >
                <Markdown>{termsMarkdown}</Markdown>
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
