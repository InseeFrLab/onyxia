
import { css } from "app/theme/useClassNames";
import { useReducer } from "react";
import type { ReactNode } from "react";
import { IconButton } from "./IconButton";
import MuiAlert from "@material-ui/lab/Alert";
import { Typography } from "app/components/designSystem/Typography";

export type Props = {
    severity: "warning" | "info" | "error"
    children: NonNullable<ReactNode>;
};

export function Alert(props: Props) {

    const { severity, children } = props;

    const [isClosed, close] = useReducer(() => true, false);

    return (
        isClosed ? null :
            <MuiAlert
                severity={severity}
                action={
                    <IconButton
                        type="closeSharp"
                        aria-label="close"
                        onClick={close}
                    />
                }
            >
                {typeof children === "string" ?
                    <Typography className={css({ "paddingTop": 2 })}>
                        {children}
                    </Typography>
                    :
                    children
                }
            </MuiAlert>
    );



}