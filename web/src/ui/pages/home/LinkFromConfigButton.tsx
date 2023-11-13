import { Button } from "onyxia-ui/Button";
import { urlToLink } from "ui/routes";
import { useResolveLocalizedString } from "ui/i18n";
import type { LinkFromConfig } from "ui/shared/LinkFromConfig";

type Props = {
    className?: string;
    linkFromConfig: LinkFromConfig;
};

export function LinkFromConfigButton(props: Props) {
    const { className, linkFromConfig } = props;

    const { resolveLocalizedString } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
    });

    const { label, url, icon } = linkFromConfig;

    const link = urlToLink(url);

    return (
        <Button
            className={className}
            href={link.href}
            doOpenNewTabIfHref={link.target === "_blank"}
            onClick={link.onClick}
            startIcon={icon}
        >
            {resolveLocalizedString(label)}
        </Button>
    );
}
