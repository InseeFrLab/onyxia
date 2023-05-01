import { clsx } from "keycloakify/tools/clsx";
import { useRerenderOnStateChange } from "evt/hooks";
import { Markdown } from "keycloakify/tools/Markdown";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { useGetClassName } from "keycloakify/login/lib/useGetClassName";
import { evtTermMarkdown } from "keycloakify/login/lib/useDownloadTerms";
import type { KcContext } from "../kcContext";
import type { I18n } from "../i18n";
import { useDownloadTerms } from "keycloakify/login";
import tos_en_url from "../assets/tos_en.md";
import tos_fr_url from "../assets/tos_fr.md";

export default function Terms(
    props: PageProps<Extract<KcContext, { pageId: "terms.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { getClassName } = useGetClassName({
        doUseDefaultCss,
        classes
    });

    const { msg, msgStr } = i18n;

    // NOTE: If you aren't going to customize the layout of the page you can move this hook to
    // KcApp.tsx, see: https://docs.keycloakify.dev/terms-and-conditions
    useDownloadTerms({
        kcContext,
        "downloadTermMarkdown": async ({ currentLanguageTag }) => {
            const resource = (() => {
                switch (currentLanguageTag) {
                    case "fr":
                        return tos_fr_url;
                    default:
                        return tos_en_url;
                }
            })();

            // webpack5 (used via storybook) loads markdown as string, not url
            if (resource.includes("\n")) return resource;

            const response = await fetch(resource);
            return response.text();
        }
    });

    useRerenderOnStateChange(evtTermMarkdown);

    const { url } = kcContext;

    const termMarkdown = evtTermMarkdown.state;

    if (termMarkdown === undefined) {
        return null;
    }

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss, classes }}
            displayMessage={false}
            headerNode={msg("termsTitle")}
        >
            <div id="kc-terms-text">
                <Markdown>{termMarkdown}</Markdown>
            </div>
            <form className="form-actions" action={url.loginAction} method="POST">
                <input
                    className={clsx(
                        getClassName("kcButtonClass"),
                        getClassName("kcButtonClass"),
                        getClassName("kcButtonClass"),
                        getClassName("kcButtonPrimaryClass"),
                        getClassName("kcButtonLargeClass")
                    )}
                    name="accept"
                    id="kc-accept"
                    type="submit"
                    value={msgStr("doAccept")}
                />
                <input
                    className={clsx(
                        getClassName("kcButtonClass"),
                        getClassName("kcButtonDefaultClass"),
                        getClassName("kcButtonLargeClass")
                    )}
                    name="cancel"
                    id="kc-decline"
                    type="submit"
                    value={msgStr("doDecline")}
                />
            </form>
            <div className="clearfix" />
        </Template>
    );
}
