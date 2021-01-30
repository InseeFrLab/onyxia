

import { createUseClassNames, cx } from "app/theme/useClassNames";
import MuiPaper from "@material-ui/core/Paper";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";

export type Props = {
    children: NonNullable<React.ReactNode>;
    elevation?: number;
    className?: string | null;
};

const defaultProps: Optional<Props> = {
    "className": null,
    "elevation": 1
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    ({ theme }, { elevation }) => ({
        "root": {
            "boxShadow": theme.custom.shadows[elevation]
        }
    })
);

export function Paper(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { children, className } = completedProps;

    const { classNames } = useClassNames(completedProps);

    return (
        <MuiPaper className={cx(classNames.root, className)} >
            {children}
        </MuiPaper>
    );

}
