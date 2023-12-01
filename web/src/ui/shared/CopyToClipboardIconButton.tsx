import { CopyToClipboardIconButton as CopyToClipboardIconButtonNoTranslations } from "onyxia-ui/CopyToClipboardIconButton";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";

type Props = {
    className?: string;
    textToCopy: string;
};

export function CopyToClipboardIconButton(props: Props) {
    const { className, textToCopy } = props;

    const { t } = useTranslation({ CopyToClipboardIconButton });

    return (
        <CopyToClipboardIconButtonNoTranslations
            className={className}
            textToCopy={textToCopy}
            copiedToClipboardText={t("copied to clipboard")}
            copyToClipboardText={t("copy to clipboard")}
        />
    );
}

export const { i18n } = declareComponentKeys<
    "copy to clipboard" | "copied to clipboard"
>()({ CopyToClipboardIconButton });
