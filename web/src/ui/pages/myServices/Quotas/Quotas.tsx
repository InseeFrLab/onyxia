import { useCoreState, useCore } from "core";
import { useEffect } from "react";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { tss } from "tss";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CircularUsage } from "./CircularUsage";
import { CollapsibleSectionHeader } from "onyxia-ui/CollapsibleSectionHeader";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { getIconUrlByName } from "lazy-icons";

type Props = {
    className?: string;
    evtActionUpdate: NonPostableEvt<void>;
};

export function Quotas(props: Props) {
    const { className, evtActionUpdate } = props;

    const {
        stateDescription,
        quotas,
        isOngoingPodDeletion,
        isOnlyNonNegligibleQuotas,
        totalQuotasCount
    } = useCoreState("viewQuotas", "main");

    const { cx, classes, theme } = useStyles();

    const { viewQuotas } = useCore().functions;

    useEffect(() => {
        const { setInactive } = viewQuotas.setActive();

        return () => {
            setInactive();
        };
    }, []);

    useEvt(
        ctx => {
            evtActionUpdate.attach(ctx, () => viewQuotas.update());
        },
        [evtActionUpdate]
    );

    const { t } = useTranslation({ Quotas });

    if (stateDescription === "disabled on instance") {
        return null;
    }

    if (stateDescription === "ready" && totalQuotasCount === 0) {
        return null;
    }

    return (
        <div className={cx(className, classes.root)}>
            {(() => {
                if (stateDescription !== "ready") {
                    return (
                        <div className={classes.loadingWrapper}>
                            <CircularProgress className={classes.loading} />
                        </div>
                    );
                }

                return (
                    <>
                        <CollapsibleSectionHeader
                            className={classes.header}
                            isCollapsed={isOnlyNonNegligibleQuotas}
                            title={
                                <>
                                    {t("resource usage quotas")}
                                    {isOngoingPodDeletion && (
                                        <>
                                            &nbsp; &nbsp;
                                            <CircularProgress
                                                className={
                                                    classes.podDeletingCircularProgress
                                                }
                                                size={
                                                    theme.typography.variants[
                                                        "section heading"
                                                    ].style.fontSize
                                                }
                                            />
                                        </>
                                    )}
                                </>
                            }
                            showAllStr={t("show more")}
                            total={totalQuotasCount}
                            onToggleIsCollapsed={
                                viewQuotas.toggleIsOnlyNonNegligibleQuotas
                            }
                        />

                        {(() => {
                            if (isOnlyNonNegligibleQuotas && quotas.length === 0) {
                                return (
                                    <Text typo="body 1">
                                        <Icon
                                            className={classes.checkIcon}
                                            icon={getIconUrlByName("CheckCircle")}
                                        />
                                        &nbsp;{t("current resource usage is reasonable")}
                                    </Text>
                                );
                            }

                            return (
                                <div className={classes.circularUsagesWrapper}>
                                    {quotas.map(
                                        (
                                            {
                                                name,
                                                used,
                                                total,
                                                usagePercentage,
                                                severity
                                            },
                                            i
                                        ) => (
                                            <CircularUsage
                                                className={classes.circularUsage}
                                                key={i}
                                                name={name}
                                                used={used}
                                                total={total}
                                                usagePercentage={usagePercentage}
                                                severity={severity}
                                            />
                                        )
                                    )}
                                </div>
                            );
                        })()}
                    </>
                );
            })()}
        </div>
    );
}

const useStyles = tss.withName({ Quotas }).create(({ theme }) => ({
    root: {},
    header: {
        ...theme.spacing.topBottom("margin", 2)
    },
    checkIcon: {
        color: theme.colors.useCases.alertSeverity.success.main
    },
    loadingWrapper: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: theme.typography.rootFontSizePx * 10
    },
    loading: {
        color: theme.colors.useCases.typography.textPrimary
    },
    podDeletingCircularProgress: {
        position: "relative",
        top: 5,
        color: theme.colors.useCases.typography.textPrimary
    },
    circularUsagesWrapper: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: theme.spacing(3)
    },
    circularUsage: {
        flexBasis: `calc(50% - ${theme.spacing(3) / 2}px)`
    }
}));

const { i18n } = declareComponentKeys<
    "show more" | "resource usage quotas" | "current resource usage is reasonable"
>()({ Quotas });
export type I18n = typeof i18n;
