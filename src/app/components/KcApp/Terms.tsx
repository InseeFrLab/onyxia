import { useEffect, memo } from "react";
import { Template } from "./Template";
import type { KcProps } from "keycloakify";
import { useKcMessage, useKcLanguageTag, kcMessages } from "keycloakify";
import { Button } from "app/theme";
import { makeStyles } from "app/theme";
import { getTosMarkdownUrl } from "./getTosMarkdownUrl";
import type { KcContext } from "./kcContext";

type KcContext_Terms = Extract<KcContext, { pageId: "terms.ftl" }>;

export const Terms = memo(
    ({ kcContext, ...props }: { kcContext: KcContext_Terms } & KcProps) => {
        const { msg, msgStr } = useKcMessage();

        const { url } = kcContext;

        const { kcLanguageTag } = useKcLanguageTag();

        useEffect(() => {
            if (kcContext!.pageId !== "terms.ftl") {
                return;
            }

            const url = getTosMarkdownUrl(kcLanguageTag);

            (url === undefined
                ? Promise.resolve(
                      [
                          "There was no therms of service provided in the Onyxia-web configuration.",
                          "Provide it or disable therms as required action in Keycloak",
                      ].join(" "),
                  )
                : fetch(url).then(response => response.text())
            ).then(rawMarkdown => (kcMessages[kcLanguageTag].termsText = rawMarkdown));
        }, [kcLanguageTag]);

        const { classes } = useStyles();

        return (
            <Template
                {...{ kcContext, ...props }}
                doFetchDefaultThemeResources={false}
                displayMessage={false}
                headerNode={null}
                formNode={
                    <>
                        <div className={classes.markdownWrapper}>{msg("termsText")}</div>

                        <form
                            className="form-actions"
                            action={url.loginAction}
                            method="POST"
                        >
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
                    </>
                }
            />
        );
    },
);

const useStyles = makeStyles({ "label": { Terms } })(theme => ({
    "buttonsWrapper": {
        "marginTop": theme.spacing(4),
        "display": "flex",
        "justifyContent": "flex-end",
    },
    "buttonSubmit": {
        "marginLeft": theme.spacing(2),
    },
    "markdownWrapper": {
        "& a": {
            "color": theme.colors.useCases.buttons.actionActive,
        },
        "& a:hover": {
            "textDecoration": "underline",
        },
    },
}));
