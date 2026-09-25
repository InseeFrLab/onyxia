import { alpha } from "@mui/material/styles";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";

type Props = {
    className?: string;
    title: string;
    message: string;
    /** What the user can do about it, laid out on the right of the text */
    action?: {
        label: string;
        onClick: () => void;
    };
};

/** Figma's "Alert" (type Error): every error of the AI providers tab is shown with it. */
export function AiAlert(props: Props) {
    const { className, title, message, action } = props;

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)} role="alert">
            <Icon
                className={classes.icon}
                icon={getIconUrlByName("DangerousOutlined")}
                size="default"
            />
            <div className={classes.text}>
                <Text typo="label 1" className={classes.title}>
                    {title}
                </Text>
                <Text typo="body 2">{message}</Text>
            </div>
            {action !== undefined && (
                <Button
                    variant="secondary"
                    className={classes.action}
                    onClick={action.onClick}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}

const useStyles = tss.withName({ AiAlert }).create(({ theme }) => {
    const color = theme.colors.useCases.alertSeverity.error.main;

    return {
        root: {
            display: "flex",
            alignItems: "flex-start",
            gap: theme.spacing(2.5),
            padding: theme.spacing(2.5),
            boxSizing: "border-box",
            border: `1px solid ${color}`,
            borderRadius: theme.spacing(2.5),
            backgroundColor: alpha(color, 0.2),
            color: theme.colors.useCases.typography.textPrimary
        },
        icon: {
            flex: "none",
            color
        },
        text: {
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflowWrap: "break-word"
        },
        title: {
            fontWeight: 600
        },
        action: {
            flex: "none",
            alignSelf: "center"
        }
    };
});
