import { default as MaterialUiAlert } from "@mui/material/Alert";
import type { AlertProps } from "@mui/material/Alert";

export const Alert: React.FC<{
    severity?: NonNullable<AlertProps["severity"]>;
    message: string;
}> = ({ severity = "success", message }) => (
    <MaterialUiAlert variant="filled" severity={severity}>
        {message}
    </MaterialUiAlert>
);
