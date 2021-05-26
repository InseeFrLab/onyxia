
import { useReducer, memo } from "react";
import type { ReactNode } from "react";
import { IconButton } from "./IconButton";
import MuiAlert from "@material-ui/lab/Alert";
import { Typography } from "app/components/designSystem/Typography";
import { createUseClassNames } from "app/theme/useClassNames";
import type { PickOptionals } from "tsafe";
import { noUndefined } from "app/tools/noUndefined";
import { cx }  from "tss-react";

export type Props = {
    className?: string | null;
    severity: "warning" | "info" | "error" | "info" | "success"
    children: NonNullable<ReactNode>;
    doDisplayCross?: boolean;
};

export const defaultProps: PickOptionals<Props> = {
    "className": null,
    "doDisplayCross": false
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    (theme, { severity }) => ({
        "root": {
            "color": theme.custom.colors.useCases.typography.textPrimary,
            "backgroundColor": theme.custom.colors.useCases.alertSeverity[severity].background,
            "& $icon": {
                "color": theme.custom.colors.useCases.alertSeverity[severity].main
            }
        },
        "text": {
            "paddingTop": 2
        }
    })
);

export const Alert = memo((props: Props) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { severity, children, className, doDisplayCross } = completedProps;

    const [isClosed, close] = useReducer(() => true, false);

    const { classNames } = useClassNames(completedProps);

    return (
        isClosed ? null :
            <MuiAlert
                className={cx(classNames.root, className)}
                severity={severity}
                action={
                    doDisplayCross ?
                        <IconButton
                            type="closeSharp"
                            aria-label="close"
                            onClick={close}
                        /> :
                        undefined
                }
            >
                {typeof children === "string" ?
                    <Typography className={classNames.text}>
                        {children}
                    </Typography>
                    :
                    children
                }
            </MuiAlert>
    );

});