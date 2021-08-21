import { default as MaterialUiAlert } from "@material-ui/core/Alert";
import type { AlertProps } from "@material-ui/core/Alert";

export const Alert: React.FC<{
    severity?: NonNullable<AlertProps["severity"]>;
    message: string;
}> = ({ severity = "success", message }) => (
    <MaterialUiAlert variant="filled" severity={severity}>
        {message}
    </MaterialUiAlert>
);
