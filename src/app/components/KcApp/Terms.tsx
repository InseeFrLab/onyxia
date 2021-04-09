import { useEffect, memo } from "react";
import { Template } from "./Template";
import type { KcContext, KcProps } from "keycloakify";
import { useKcMessage, useKcLanguageTag, kcMessages } from "keycloakify";
import tos_fr_url from "app/assets/md/tos_fr.md";
import tos_en_url from "app/assets/md/tos_en.md";
import { Button } from "app/components/designSystem/Button";
import { createUseClassNames } from "app/theme/useClassNames";

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
    })
);

export const Terms = memo(({ kcContext, ...props }: { kcContext: KcContext.Terms; } & KcProps) => {

    const { msg, msgStr } = useKcMessage();

    const { url } = kcContext;

    const { kcLanguageTag } = useKcLanguageTag();

    useEffect(
        () => {

            if (kcContext!.pageId !== "terms.ftl") {
                return;
            }

            fetch((() => {
                switch (kcLanguageTag) {
                    case "fr": return tos_fr_url;
                    default: return tos_en_url;
                }
            })())
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
            displayMessage={false}
            headerNode={null}
            formNode={
                <>
                    <div>
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
