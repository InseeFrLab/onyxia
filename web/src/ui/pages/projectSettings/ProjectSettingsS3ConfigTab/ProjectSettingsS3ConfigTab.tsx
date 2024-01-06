import { memo } from "react";
import { useCore, useCoreState } from "core";
import { S3ConfigDialogs, Props as S3ConfigDialogsProps } from "./S3ConfigDialogs";
import { useConst } from "powerhooks/useConst";
import { Evt, type UnpackEvt } from "evt";
import { S3ConfigCard } from "./S3ConfigCard";
import { Button } from "onyxia-ui/Button";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";

export type Props = {
    className?: string;
};

export const ProjectSettingsS3ConfigTab = memo((props: Props) => {
    const { className } = props;

    const { evtConfirmCustomS3ConfigDeletionDialogOpen, evtAddCustomS3ConfigDialogOpen } =
        useConst(() => ({
            "evtConfirmCustomS3ConfigDeletionDialogOpen":
                Evt.create<
                    UnpackEvt<
                        S3ConfigDialogsProps["evtConfirmCustomS3ConfigDeletionDialogOpen"]
                    >
                >(),
            "evtAddCustomS3ConfigDialogOpen":
                Evt.create<
                    UnpackEvt<S3ConfigDialogsProps["evtAddCustomS3ConfigDialogOpen"]>
                >()
        }));

    const { s3Configs, newCustomConfigDefaultValues } = useCoreState(
        "s3ConfigManagement",
        "main"
    );

    const { s3ConfigManagement } = useCore().functions;

    return (
        <div className={className}>
            {s3Configs.map(s3Config => (
                <S3ConfigCard
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
                onClick={() =>
                    evtAddCustomS3ConfigDialogOpen.post({
                        "defaultValues": newCustomConfigDefaultValues,
                        "resolveNewCustomConfig": ({ newCustomConfig }) => {
                            if (newCustomConfig === undefined) {
                                return;
                            }

                            s3ConfigManagement.addCustomS3Config({
                                "customS3Config": newCustomConfig
                            });
                        }
                    })
                }
            >
                Add a custom S3 configuration
            </Button>
        </div>
    );
});
