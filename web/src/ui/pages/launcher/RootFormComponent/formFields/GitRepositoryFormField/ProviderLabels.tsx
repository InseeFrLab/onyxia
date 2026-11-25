import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { useTranslation } from "ui/i18n";
import type { ConnectedProvider } from "core/usecases/gitProvidersManagement";
import type { DisconnectedProviderView } from "core/usecases/gitRepositoryFieldUiController";
import { tss } from "tss";
import { getSharedStyles } from "./sharedStyles";

export type ProviderChip = {
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

export function Chip(props: { chip: ProviderChip }) {
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

export function ProviderLabel(props: {
    logoUrl: string;
    displayName: string;
    /** undefined: no chip */
    chip?: ProviderChip;
}) {
    const { logoUrl, displayName, chip } = props;

    const { classes } = useStyles();

    return (
        <span className={classes.providerLabel}>
            <img className={classes.providerLogo} src={logoUrl} alt="" />
            <span className={classes.ellipsis}>{displayName}</span>
            {chip !== undefined && <Chip chip={chip} />}
        </span>
    );
}

/** A row of the Git profile select: who is connected, or what to do */
export function ProviderMenuItemContent(props: {
    provider: ConnectedProvider | DisconnectedProviderView;
    logoUrl: string;
    chip: ProviderChip;
}) {
    const { provider, logoUrl, chip } = props;

    const { classes } = useStyles();
    const { t } = useTranslation("GitRepositoryFormField");
    const { t: t_card } = useTranslation("GitProviderCard");

    return (
        <span className={classes.providerMenuRow}>
            <img className={classes.providerMenuLogo} src={logoUrl} alt="" />
            <span className={classes.providerMenuText}>
                <span className={classes.providerMenuName}>{provider.displayName}</span>
                <span className={classes.providerMenuSubtitle}>
                    {"issue" in provider
                        ? t_card("not connected")
                        : t("connected as", { username: provider.username })}
                </span>
            </span>
            {"issue" in provider ? (
                // NOTE: What to do is shown under the field once the profile is picked.
                <Chip chip={chip} />
            ) : (
                <Icon
                    className={classes.providerMenuCheck}
                    icon={getIconUrlByName("Check")}
                    size="small"
                />
            )}
        </span>
    );
}

const useStyles = tss.withName("ProviderLabels").create(({ theme }) => {
    const { ellipsis, providerLabel, providerLogo } = getSharedStyles({ theme });

    return {
        ellipsis,
        providerLabel,
        providerLogo,
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
        providerMenuCheck: {
            flexShrink: 0,
            color: theme.colors.useCases.alertSeverity.success.main
        },
        providerMenuLogo: {
            width: 32,
            height: 32,
            flexShrink: 0,
            objectFit: "contain",
            borderRadius: theme.spacing(2)
        },
        providerMenuName: {
            ...theme.typography.variants["label 1"].style,
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
        },
        providerMenuRow: {
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(3)
        },
        providerMenuSubtitle: {
            ...theme.typography.variants["caption"].style,
            color: theme.colors.useCases.typography.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
        },
        providerMenuText: {
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column"
        }
    };
});
