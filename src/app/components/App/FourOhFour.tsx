
import { useTranslation } from "app/i18n/useTranslations";

export type Props = {
    className?: string;
};

export function FourOhFour(props: Props) {

    const { className } = props;

    const { t } = useTranslation("FourOhFour");

    return (
        <div className={className}>
            {t("not found")}
        </div>
    );

}


export declare namespace FourOhFour {

    export type I18nScheme = {
        'not found': undefined;
    };

}

