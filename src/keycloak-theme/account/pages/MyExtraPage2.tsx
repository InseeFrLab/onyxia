import type { PageProps } from "keycloakify/account/pages/PageProps";
import type { KcContext } from "../kcContext";
import type { I18n } from "../i18n";

export default function MyExtraPage1(
    props: PageProps<Extract<KcContext, { pageId: "my-extra-page-2.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    // someCustomValue is declared by you in ../kcContext.ts
    console.log(`TODO: Do something with: ${kcContext.someCustomValue}`);

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss, classes }}
            active="my-extra-page-2"
        >
            <h1>Hello world 2</h1>
        </Template>
    );
}
