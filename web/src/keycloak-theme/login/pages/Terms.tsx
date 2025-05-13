import { useState, useEffect } from "react";
import { Markdown } from "onyxia-ui/Markdown";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { createResolveLocalizedStringFactory } from "i18nifty/LocalizedString/LocalizedString";
import { env } from "env";

export default function Terms(
    props: PageProps<Extract<KcContext, { pageId: "terms.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes: props_classes } = props;

    const { msgStr } = i18n;

    const { url } = kcContext;

    const { classes } = useStyles();

    const [tos, setTos] = useState<
        { termsMarkdown: string; langOfTheTerms: string | undefined } | undefined
    >(undefined);

    useEffect(() => {
        let isActive = true;

        (async () => {
            const currentLanguageTag = kcContext.locale?.currentLanguageTag ?? "en";

            if (env.TERMS_OF_SERVICES === undefined) {
                setTos({
                    termsMarkdown:
                        "TERMS_OF_SERVICES was not defined on this Onyxia instance",
                    langOfTheTerms: "en"
                });
                return;
            }

            const { createResolveLocalizedString } = createResolveLocalizedStringFactory({
                createJsxElement: ({ text, lang }) => ({ text, lang })
            });

            const { resolveLocalizedString } = createResolveLocalizedString({
                currentLanguage: currentLanguageTag,
                fallbackLanguage: "en",
                labelWhenMismatchingLanguage: true
            });

            const { text: termsUrl, lang: langOfTheTerms } = resolveLocalizedString(
                env.TERMS_OF_SERVICES
            );

            const termsMarkdown = await fetch(termsUrl).then(r => r.text());

            if (!isActive) {
                return;
            }

            setTos({ termsMarkdown, langOfTheTerms });
        })();

        return () => {
            isActive = false;
        };
    }, []);

    if (tos === undefined) {
        return <CircularProgress />;
    }

    const { langOfTheTerms, termsMarkdown } = tos;

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss }}
            classes={props_classes}
            displayMessage={false}
            headerNode={null}
            i18n={i18n}
        >
            <div className={classes.markdownWrapper}>
                <Markdown lang={langOfTheTerms}>{termsMarkdown}</Markdown>
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
    buttonsWrapper: {
        marginTop: theme.spacing(4),
        display: "flex",
        justifyContent: "flex-end"
    },
    buttonSubmit: {
        marginLeft: theme.spacing(2)
    },
    markdownWrapper: {
        "& a": {
            color: theme.colors.useCases.buttons.actionActive
        },
        "& a:hover": {
            textDecoration: "underline"
        }
    }
}));
