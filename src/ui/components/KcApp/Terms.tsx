import { memo } from "react";
import { Template } from "./Template";
import type { KcProps } from "keycloakify";
import { useDownloadTerms } from "keycloakify";
import { Button } from "ui/theme";
import { makeStyles } from "ui/theme";
import { getTosMarkdownUrl } from "./getTosMarkdownUrl";
import type { KcContext } from "./kcContext";
import type { I18n } from "./i18n";
import { evtTermMarkdown } from "keycloakify/lib/components/Terms";
import { useRerenderOnStateChange } from "evt/hooks";
import { Markdown } from "keycloakify/lib/tools/Markdown";

type KcContext_Terms = Extract<KcContext, { pageId: "terms.ftl" }>;

const Terms = memo(
    ({
        kcContext,
        i18n,
        ...props
    }: { kcContext: KcContext_Terms; i18n: I18n } & KcProps) => {
        const { msgStr } = i18n;

        const { url } = kcContext;

        useDownloadTerms({
            kcContext,
            "downloadTermMarkdown": ({ currentLanguageTag }) => {
                const url = getTosMarkdownUrl(currentLanguageTag);

                return url === undefined
                    ? Promise.resolve(
                          [
                              "There was no therms of service provided in the Onyxia-web configuration.",
                              "Provide it or disable therms as required action in Keycloak",
                          ].join(" "),
                      )
                    : fetch(url).then(response => response.text());
            },
        });

        useRerenderOnStateChange(evtTermMarkdown);

        const { classes } = useStyles();

        if (evtTermMarkdown.state === undefined) {
            return null;
        }

        return (
            <Template
                {...{ kcContext, ...props }}
                doFetchDefaultThemeResources={false}
                displayMessage={false}
                headerNode={null}
                i18n={i18n}
                formNode={
                    <>
                        <div className={classes.markdownWrapper}>
                            {evtTermMarkdown.state && (
                                <Markdown>{evtTermMarkdown.state}</Markdown>
                            )}
                        </div>
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

export default Terms;

const useStyles = makeStyles({ "name": { Terms } })(theme => ({
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
