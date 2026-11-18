import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";

type Props = {
    className?: string;
    /** undefined: the message alone */
    title?: string;
    message: ReactNode;
    /** What the user can do about it, laid out on the right of the text */
    action?: {
        label: string;
        isDisabled?: boolean;
    } & ({ onClick: () => void; href?: never } | { href: string; onClick?: never });
    /** Figma's Alert types. "info": something to do, nothing went wrong. */
    severity?: "error" | "warning" | "info";
};

const iconNameBySeverity = {
    error: "DangerousOutlined",
    warning: "WarningAmber",
    info: "SentimentSatisfiedAlt"
} as const;

/** Figma's "Alert": the errors of the account tabs, the Git notices of the launcher. */
export function ErrorAlert(props: Props) {
    const { className, title, message, action, severity = "error" } = props;

    const { classes, cx } = useStyles({ severity });

    return (
        <div
            className={cx(classes.root, className)}
            role={severity === "info" ? "status" : "alert"}
        >
            <Icon
                className={classes.icon}
                icon={getIconUrlByName(iconNameBySeverity[severity])}
                size="default"
            />
            <div className={classes.text}>
                {title !== undefined && (
                    <Text typo="label 1" className={classes.title}>
                        {title}
                    </Text>
                )}
                <Text typo="body 2">{message}</Text>
            </div>
            {action !== undefined && (
                <Button
                    variant="secondary"
                    className={classes.action}
                    disabled={action.isDisabled}
                    {...(action.href !== undefined
                        ? { href: action.href, doOpenNewTabIfHref: false }
                        : { onClick: action.onClick })}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}

const useStyles = tss
    .withName({ ErrorAlert })
    .withParams<{ severity: NonNullable<Props["severity"]> }>()
    .create(({ theme, severity }) => {
        const color =
            severity === "info"
                ? theme.colors.useCases.typography.textPrimary
                : theme.colors.useCases.alertSeverity[severity].main;

        return {
            root: {
                display: "flex",
                alignItems: "flex-start",
                gap: theme.spacing(2.5),
                padding: theme.spacing(2.5),
                boxSizing: "border-box",
                border: `1px solid ${
                    severity === "info" ? theme.colors.useCases.surfaces.surface3 : color
                }`,
                borderRadius: theme.spacing(2.5),
                backgroundColor:
                    severity === "info"
                        ? theme.colors.useCases.surfaces.surface2
                        : alpha(color, 0.2),
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
