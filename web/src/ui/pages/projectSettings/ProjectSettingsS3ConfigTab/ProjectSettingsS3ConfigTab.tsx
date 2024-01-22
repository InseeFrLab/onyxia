import { memo } from "react";
import { useCore, useCoreState } from "core";
import { S3ConfigDialogs, Props as S3ConfigDialogsProps } from "./S3ConfigDialogs";
import { useConst } from "powerhooks/useConst";
import { Evt, type UnpackEvt } from "evt";
import { S3ConfigCard } from "./S3ConfigCard";
import { Button } from "onyxia-ui/Button";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { tss } from "tss";
import {
    MaybeAcknowledgeConfigVolatilityDialog,
    type MaybeAcknowledgeConfigVolatilityDialogProps
} from "ui/shared/MaybeAcknowledgeConfigVolatilityDialog";
import { Deferred } from "evt/tools/Deferred";

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
        "evtConfirmCustomS3ConfigDeletionDialogOpen":
            Evt.create<
                UnpackEvt<
                    S3ConfigDialogsProps["evtConfirmCustomS3ConfigDeletionDialogOpen"]
                >
            >(),
        "evtAddCustomS3ConfigDialogOpen":
            Evt.create<
                UnpackEvt<S3ConfigDialogsProps["evtAddCustomS3ConfigDialogOpen"]>
            >(),
        "evtMaybeAcknowledgeConfigVolatilityDialogOpen":
            Evt.create<MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"]>()
    }));

    const s3Configs = useCoreState("s3ConfigManagement", "s3Configs");

    const { s3ConfigManagement } = useCore().functions;

    const { classes } = useStyles();

    return (
        <>
            <div className={className}>
                {s3Configs.map(s3Config => (
                    <S3ConfigCard
                        className={classes.card}
                        key={s3Config.customConfigIndex ?? -1}
                        dataSource={s3Config.dataSource}
                        region={s3Config.region}
                        isUsedForExplorer={s3Config.isUsedForExplorer}
                        isUsedForXOnyxia={s3Config.isUsedForXOnyxia}
                        accountFriendlyName={s3Config.accountFriendlyName}
                        onDelete={(() => {
                            const { customConfigIndex } = s3Config;

                            if (customConfigIndex === undefined) {
                                return undefined;
                            }

                            return () =>
                                evtConfirmCustomS3ConfigDeletionDialogOpen.post({
                                    "resolveDoProceed": doProceed => {
                                        if (!doProceed) {
                                            return;
                                        }

                                        s3ConfigManagement.deleteCustomS3Config({
                                            customConfigIndex
                                        });
                                    }
                                });
                        })()}
                        onIsUsedForExplorerValueChange={(() => {
                            if (
                                s3Config.accountFriendlyName === undefined &&
                                s3Config.isUsedForExplorer
                            ) {
                                return undefined;
                            }

                            return isUsed =>
                                s3ConfigManagement.setConfigUsage({
                                    "customConfigIndex": s3Config.customConfigIndex,
                                    "usedFor": "explorer",
                                    isUsed
                                });
                        })()}
                        onIsUsedForXOnyxiaValueChange={(() => {
                            if (
                                s3Config.accountFriendlyName === undefined &&
                                s3Config.isUsedForXOnyxia
                            ) {
                                return undefined;
                            }

                            return isUsed =>
                                s3ConfigManagement.setConfigUsage({
                                    "customConfigIndex": s3Config.customConfigIndex,
                                    "usedFor": "xOnyxia",
                                    isUsed
                                });
                        })()}
                        onEdit={(() => {
                            const { customConfigIndex } = s3Config;

                            if (customConfigIndex === undefined) {
                                return undefined;
                            }

                            return () =>
                                evtAddCustomS3ConfigDialogOpen.post({
                                    customConfigIndex
                                });
                        })()}
                        doHideUsageSwitches={
                            s3Config.accountFriendlyName === undefined &&
                            s3Configs.length === 1
                        }
                    />
                ))}
                <S3ConfigDialogs
                    evtConfirmCustomS3ConfigDeletionDialogOpen={
                        evtConfirmCustomS3ConfigDeletionDialogOpen
                    }
                    evtAddCustomS3ConfigDialogOpen={evtAddCustomS3ConfigDialogOpen}
                />
                <Button
                    startIcon={id<MuiIconComponentName>("Add")}
                    onClick={async () => {
                        const dDoProceed = new Deferred<boolean>();

                        evtMaybeAcknowledgeConfigVolatilityDialogOpen.post({
                            "resolve": ({ doProceed }) => dDoProceed.resolve(doProceed)
                        });

                        if (!(await dDoProceed.pr)) {
                            return;
                        }

                        evtAddCustomS3ConfigDialogOpen.post({
                            "customConfigIndex": undefined
                        });
                    }}
                >
                    Add a custom S3 configuration
                </Button>
            </div>
            <MaybeAcknowledgeConfigVolatilityDialog
                evtOpen={evtMaybeAcknowledgeConfigVolatilityDialogOpen}
            />
        </>
    );
});

const useStyles = tss.withName({ ProjectSettingsS3ConfigTab }).create(({ theme }) => ({
    "card": {
        "marginBottom": theme.spacing(3)
    }
}));
