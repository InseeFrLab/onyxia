import { Button, type ButtonProps } from "onyxia-ui/Button";
import { urlToLink } from "ui/routes";
import type { LinkFromConfig } from "ui/shared/LinkFromConfig";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { getIconUrl } from "lazy-icons";

type Props = {
    className?: string;
    linkFromConfig: LinkFromConfig;
    variant?: ButtonProps["variant"];
};

export function LinkFromConfigButton(props: Props) {
    const { className, linkFromConfig, variant } = props;

    const { label, url, icon, startIcon, endIcon } = linkFromConfig;

    const link = urlToLink(url);

    return (
        <Button
            className={className}
            href={link.href}
            doOpenNewTabIfHref={link.target === "_blank"}
            onClick={link.onClick}
            startIcon={getIconUrl(icon) ?? getIconUrl(startIcon)}
            endIcon={getIconUrl(endIcon)}
            variant={variant}
        >
            <LocalizedMarkdown inline>{label}</LocalizedMarkdown>
        </Button>
    );
}
