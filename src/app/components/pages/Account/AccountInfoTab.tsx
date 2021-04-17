
import { memo } from "react";
import { useTranslation } from "app/i18n/useTranslations";

export type Props = { 
    className?: string;
};

export const AccountInfoTab = memo((props: Props)=>{

    const { t } = useTranslation("AccountInfoTab");

    return null;

});

export declare namespace AccountInfoTab {

    export type I18nScheme = {
    };

}