
import { memo } from "react";
import Avatar from "@material-ui/core/Avatar";
import { ReactComponent as FallbackSvg } from "app/assets/svg/singlePackage.svg";
import { createUseClassNames } from "app/theme";

export type RoundLogoProps = {
    className?: string;
    url: string | undefined;
};

const { useClassNames } = createUseClassNames()(
    theme=> ({
        "fallback": {
            "fill": theme.colors.useCases.typography.textPrimary
        }
    })
);

export const RoundLogo = memo((props: RoundLogoProps) => {

    const { url, className } = props;

    const { classNames } = useClassNames({});

    return (
        <Avatar src={url} className={className}>
            <FallbackSvg className={classNames.fallback} />
        </Avatar>
    );

});

