
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";

import { memo } from "react";
import MuiCircularProgress from "@material-ui/core/CircularProgress";
import type { PickOptionals } from "tsafe";
import { noUndefined } from "app/tools/noUndefined";

export type Props = {
    className?: string | null;
    size?: number;
    color?: "primary" | "textPrimary"
};

export const defaultProps: PickOptionals<Props> = {
    "className": null,
    "size": 40,
    "color": "primary"
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    (theme, { color }) => ({
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
            className={cx(classNames.root, className)}
            size={size}
        />
    );

});
