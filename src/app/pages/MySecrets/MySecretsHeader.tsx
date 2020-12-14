
import React from "react";
import { PageHeader } from "app/components/PageHeader";
import { useTranslation } from "app/i18n/useTranslations";
import { Link } from "app/components/designSystem/Link";

export function MySecretsHeader() {

    const { t } = useTranslation("MySecretsHeader");

    return <PageHeader
        icon="lock"
        text1={t("page title")}
        text2={t("what this page is used for")}
        text3={(t as any)("to learn more read", { "what": <Link href="#">{t("tfm")}</Link> })}
    />;

}

export declare namespace MySecretsHeader {

    export type I18nScheme = {
        'page title': undefined;
        'what this page is used for': undefined;
        'to learn more read': { what: string; }
        tfm: undefined;
    };

}