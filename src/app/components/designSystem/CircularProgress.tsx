
import { createUseClassNames, cx } from "app/theme/useClassNames";

import { memo } from "react";
import MuiCircularProgress from "@material-ui/core/CircularProgress";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    className?: string | null;
    size?: number;
    color?: "primary" | "textPrimary"
};

export const defaultProps: Optional<Props> = {
    "className": null,
    "size": 40,
    "color": "primary"
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    ({ theme }, { color }) => ({
        "root": {
            "color": color !== "textPrimary" ?
                undefined :
                theme.palette.text.primary
        }
    })
);


export const CircularProgress = memo((props: Props) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { color, size, className } = completedProps;

    const { classNames } = useClassNames(completedProps);

    return (
        <MuiCircularProgress
            color={color === "textPrimary" ? undefined : color}
            css={cx(classNames.root, className)}
            size={size}
        />
    );

});
