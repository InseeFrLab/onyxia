
import { default as MaterialUiAlert } from "@material-ui/lab/Alert";
import type { AlertProps } from "@material-ui/lab/Alert";

export const Alert: React.FC<{ 
    severity?: NonNullable<AlertProps["severity"]>;
    message: string
}> = ({ severity = "success", message }) => (
	<MaterialUiAlert variant="filled" severity={severity}>
		{message}
	</MaterialUiAlert>
);

