import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { useTranslation } from "ui/i18n";
import type { ConnectedForge } from "core/usecases/gitForgesManagement";
import type { DisconnectedForgeView } from "core/usecases/gitRepositoryFieldUiController";
import { tss } from "tss";
import { getSharedStyles } from "./sharedStyles";

export type ForgeChip = {
    label: string;
    severity: "success" | "neutral" | "warning" | "error";
};

export function FieldLabel(props: { htmlFor: string; children: string }) {
    const { htmlFor, children } = props;

    return (
        <label htmlFor={htmlFor}>
            <Text typo="label 1" htmlComponent="span">
                {children}
            </Text>
        </label>
    );
}

export function Chip(props: { chip: ForgeChip }) {
    const { chip } = props;

    const { classes, cx } = useStyles();

    return (
        <span
            className={cx(
                classes.chip,
                chip.severity === "neutral" && classes.chip_neutral,
                chip.severity === "warning" && classes.chip_warning,
                chip.severity === "error" && classes.chip_error
            )}
        >
            <span
                className={cx(
                    classes.chipDot,
                    chip.severity === "neutral" && classes.chipDot_neutral,
                    chip.severity === "warning" && classes.chipDot_warning,
                    chip.severity === "error" && classes.chipDot_error
                )}
            />
            {chip.label}
        </span>
    );
}

export function ForgeLabel(props: {
    logoUrl: string;
    displayName: string;
    /** undefined: no chip */
    chip?: ForgeChip;
}) {
    const { logoUrl, displayName, chip } = props;

    const { classes } = useStyles();

    return (
        <span className={classes.forgeLabel}>
            <img className={classes.forgeLogo} src={logoUrl} alt="" />
            <span className={classes.ellipsis}>{displayName}</span>
            {chip !== undefined && <Chip chip={chip} />}
        </span>
    );
}

/** A row of the Git profile select: who is connected, or what to do */
export function ForgeMenuItemContent(props: {
    forge: ConnectedForge | DisconnectedForgeView;
    logoUrl: string;
    chip: ForgeChip;
}) {
    const { forge, logoUrl, chip } = props;

    const { classes } = useStyles();
    const { t } = useTranslation("GitRepositoryFormField");
    const { t: t_card } = useTranslation("GitForgeCard");

    return (
        <span className={classes.forgeMenuRow}>
            <img className={classes.forgeMenuLogo} src={logoUrl} alt="" />
            <span className={classes.forgeMenuText}>
                <span className={classes.forgeMenuName}>{forge.displayName}</span>
                <span className={classes.forgeMenuSubtitle}>
                    {"issue" in forge
                        ? t_card("not connected")
                        : t("connected as", { username: forge.username })}
                </span>
            </span>
            {"issue" in forge ? (
                // NOTE: What to do is shown under the field once the profile is picked.
                <Chip chip={chip} />
            ) : (
                <Icon
                    className={classes.forgeMenuCheck}
                    icon={getIconUrlByName("Check")}
                    size="small"
                />
            )}
        </span>
    );
}

const useStyles = tss.withName("ForgeLabels").create(({ theme }) => {
    const { ellipsis, forgeLabel, forgeLogo } = getSharedStyles({ theme });

    return {
        ellipsis,
        forgeLabel,
        forgeLogo,
        chip: {
            ...theme.typography.variants["caption"].style,
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(1),
            flexShrink: 0,
            padding: theme.spacing({ topBottom: 1, rightLeft: 2 }),
            borderRadius: 100,
            color: theme.colors.useCases.typography.textPrimary,
            backgroundColor: theme.colors.useCases.alertSeverity.success.background
        },
        chipDot: {
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: theme.colors.useCases.alertSeverity.success.main
        },
        chipDot_error: {
            backgroundColor: theme.colors.useCases.alertSeverity.error.main
        },
        chipDot_neutral: {
            backgroundColor: theme.colors.useCases.typography.textSecondary
        },
        chipDot_warning: {
            backgroundColor: theme.colors.useCases.alertSeverity.warning.main
        },
        chip_error: {
            backgroundColor: theme.colors.useCases.alertSeverity.error.background
        },
        // NOTE: Figma's surface-tertiary
        chip_neutral: {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        chip_warning: {
            backgroundColor: theme.colors.useCases.alertSeverity.warning.background
        },
        forgeMenuCheck: {
            flexShrink: 0,
            color: theme.colors.useCases.alertSeverity.success.main
        },
        forgeMenuLogo: {
            width: 32,
            height: 32,
            flexShrink: 0,
            objectFit: "contain",
            borderRadius: theme.spacing(2)
        },
        forgeMenuName: {
            ...theme.typography.variants["label 1"].style,
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
        },
        forgeMenuRow: {
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(3)
        },
        forgeMenuSubtitle: {
            ...theme.typography.variants["caption"].style,
            color: theme.colors.useCases.typography.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
        },
        forgeMenuText: {
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column"
        }
    };
});
