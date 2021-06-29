import { useEffect, memo } from "react";
import { Template } from "./Template";
import type { KcProps } from "keycloakify";
import { useKcMessage, useKcLanguageTag, kcMessages } from "keycloakify";
import { Button } from "app/theme";
import { createUseClassNames } from "app/theme";
import { getTosMarkdownUrl } from "./getTosMarkdownUrl";
import type { KcContext } from "./kcContext";

const { useClassNames } = createUseClassNames()(
    theme => ({
        "buttonsWrapper": {
            "marginTop": theme.spacing(3),
            "display": "flex",
            "justifyContent": "flex-end"
        },
        "buttonSubmit": {
            "marginLeft": theme.spacing(1)
        },
        "markdownWrapper": {
            "& a": {
                "color": theme.colors.useCases.buttons.actionActive
            },
            "& a:hover": {
                "textDecoration": "underline"
            }
        }
    })
);

type KcContext_Terms = Extract<KcContext, { pageId: "terms.ftl"; }>;

export const Terms = memo(({ kcContext, ...props }: { kcContext: KcContext_Terms; } & KcProps) => {

    const { msg, msgStr } = useKcMessage();

    const { url } = kcContext;

    const { kcLanguageTag } = useKcLanguageTag();

    useEffect(
        () => {

            if (kcContext!.pageId !== "terms.ftl") {
                return;
            }

            fetch(getTosMarkdownUrl(kcLanguageTag))
                .then(response => response.text())
                .then(rawMarkdown => kcMessages[kcLanguageTag].termsText = rawMarkdown);

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [kcLanguageTag]
    );

    const { classNames } = useClassNames({});

    return (
        <Template
            {...{ kcContext, ...props }}
            doFetchDefaultThemeResources={false}
            displayMessage={false}
            headerNode={null}
            formNode={
                <>
                    <div className={classNames.markdownWrapper}>
                        {msg("termsText")}
                    </div>

                    <form className="form-actions" action={url.loginAction} method="POST">
                        <div className={classNames.buttonsWrapper}>
                            <Button
                                color="secondary"
                                name="cancel"
                                type="submit"
                            >
                                {msgStr("doDecline")}
                            </Button>
                            <Button
                                tabIndex={1}
                                className={classNames.buttonSubmit}
                                name="accept"
                                autoFocus={true}
                                type="submit"
                            >
                                {msgStr("doAccept")}
                            </Button>
                        </div>
                    </form>
                </>
            }
        />
    );
});

