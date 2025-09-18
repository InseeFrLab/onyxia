import { memo } from "react";
import { useCoreState, getCoreSync } from "core";
import { S3ConfigDialogs, type S3ConfigDialogsProps } from "./S3ConfigDialogs";
import { useConst } from "powerhooks/useConst";
import { Evt, type UnpackEvt } from "evt";
import { S3ConfigCard } from "./S3ConfigCard";
import { Button } from "onyxia-ui/Button";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import {
    MaybeAcknowledgeConfigVolatilityDialog,
    type MaybeAcknowledgeConfigVolatilityDialogProps
} from "ui/shared/MaybeAcknowledgeConfigVolatilityDialog";
import { Deferred } from "evt/tools/Deferred";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type Props = {
    className?: string;
};

export const ProjectSettingsS3ConfigTab = memo((props: Props) => {
    const { className } = props;

    const {
        evtConfirmCustomS3ConfigDeletionDialogOpen,
        evtAddCustomS3ConfigDialogOpen,
        evtMaybeAcknowledgeConfigVolatilityDialogOpen
    } = useConst(() => ({
        evtConfirmCustomS3ConfigDeletionDialogOpen:
            Evt.create<
                UnpackEvt<
                    S3ConfigDialogsProps["evtConfirmCustomS3ConfigDeletionDialogOpen"]
                >
            >(),
        evtAddCustomS3ConfigDialogOpen:
            Evt.create<
                UnpackEvt<S3ConfigDialogsProps["evtAddCustomS3ConfigDialogOpen"]>
            >(),
        evtMaybeAcknowledgeConfigVolatilityDialogOpen:
            Evt.create<MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"]>()
    }));

    const s3Configs = useCoreState("s3ConfigManagement", "s3Configs");
    const canInjectPersonalInfos = useCoreState(
        "projectManagement",
        "canInjectPersonalInfos"
    );
    const {
        functions: { s3ConfigManagement }
    } = getCoreSync();

    const { classes, css, theme } = useStyles();

    const { t } = useTranslation({ ProjectSettingsS3ConfigTab });

    return (
        <>
            <div className={className}>
                <div className={classes.cardsWrapper}>
                    {s3Configs.map(s3Config => (
                        <S3ConfigCard
                            key={s3Config.id}
                            className={classes.card}
                            s3Config={s3Config}
                            onDelete={(() => {
                                if (s3Config.origin !== "project") {
                                    return undefined;
                                }

                                return () =>
                                    s3ConfigManagement.deleteS3Config({
                                        projectS3ConfigId: s3Config.id
                                    });
                            })()}
                            onIsExplorerConfigChange={value =>
                                s3ConfigManagement.changeIsDefault({
                                    s3ConfigId: s3Config.id,
                                    usecase: "explorer",
                                    value
                                })
                            }
                            onIsOnyxiaDefaultChange={value =>
                                s3ConfigManagement.changeIsDefault({
                                    s3ConfigId: s3Config.id,
                                    usecase: "defaultXOnyxia",
                                    value
                                })
                            }
                            onEdit={(() => {
                                if (s3Config.origin !== "project") {
                                    return undefined;
                                }

                                return () =>
                                    evtAddCustomS3ConfigDialogOpen.post({
                                        s3ConfigIdToEdit: s3Config.id
                                    });
                            })()}
                            onTestConnection={(() => {
                                if (s3Config.origin !== "project") {
                                    return undefined;
                                }

                                return () =>
                                    s3ConfigManagement.testS3Connection({
                                        projectS3ConfigId: s3Config.id
                                    });
                            })()}
                            canInjectPersonalInfos={canInjectPersonalInfos}
                        />
                    ))}
                </div>
                <Button
                    className={css({
                        float: "right",
                        marginRight: theme.spacing(3),
                        marginBottom: theme.spacing(4)
                    })}
                    startIcon={getIconUrlByName("Add")}
                    onClick={async () => {
                        const dDoProceed = new Deferred<boolean>();

                        evtMaybeAcknowledgeConfigVolatilityDialogOpen.post({
                            resolve: ({ doProceed }) => dDoProceed.resolve(doProceed)
                        });

                        if (!(await dDoProceed.pr)) {
                            return;
                        }

                        evtAddCustomS3ConfigDialogOpen.post({
                            s3ConfigIdToEdit: undefined
                        });
                    }}
                >
                    {t("add custom config")}
                </Button>
                <S3ConfigDialogs
                    evtConfirmCustomS3ConfigDeletionDialogOpen={
                        evtConfirmCustomS3ConfigDeletionDialogOpen
                    }
                    evtAddCustomS3ConfigDialogOpen={evtAddCustomS3ConfigDialogOpen}
                />
            </div>
            <MaybeAcknowledgeConfigVolatilityDialog
                evtOpen={evtMaybeAcknowledgeConfigVolatilityDialogOpen}
            />
        </>
    );
});

const useStyles = tss.withName({ ProjectSettingsS3ConfigTab }).create(({ theme }) => ({
    cardsWrapper: {
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(3),
        marginBottom: theme.spacing(4),
        ...theme.spacing.rightLeft("padding", 3)
    },
    card: {
        flexBasis: `calc(50% - ${theme.spacing(3) / 2}px)`
    }
}));

const { i18n } = declareComponentKeys<"add custom config">()({
    ProjectSettingsS3ConfigTab
});
export type I18n = typeof i18n;
