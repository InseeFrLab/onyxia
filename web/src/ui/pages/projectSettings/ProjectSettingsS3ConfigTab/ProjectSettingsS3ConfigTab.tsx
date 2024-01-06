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

    const { stsS3Config, customS3Configs, newCustomConfigDefaultValues } = useCoreState(
        "s3ConfigManagement",
        "main"
    );

    const { s3ConfigManagement } = useCore().functions;

    return (
        <div className={className}>
            {stsS3Config !== undefined && (
                <S3ConfigCard
                    url={stsS3Config.url}
                    region={stsS3Config.region}
                    workingDirectoryPath={stsS3Config.workingDirectoryPath}
                    credentials={undefined}
                    pathStyleAccess={stsS3Config.pathStyleAccess}
                    isUsedForExplorer={stsS3Config.isUsedForExplorer}
                    isUsedForXOnyxia={stsS3Config.isUsedForXOnyxia}
                    onDelete={undefined}
                    onIsUsedForExplorerValueChange={
                        stsS3Config.isUsedForExplorer
                            ? undefined
                            : isUsed =>
                                  s3ConfigManagement.setConfigUsage({
                                      "customS3ConfigId": undefined,
                                      "usedFor": "explorer",
                                      isUsed
                                  })
                    }
                    onIsUsedForXOnyxiaValueChange={
                        stsS3Config.isUsedForXOnyxia
                            ? undefined
                            : isUsed =>
                                  s3ConfigManagement.setConfigUsage({
                                      "customS3ConfigId": undefined,
                                      "usedFor": "xOnyxia",
                                      isUsed
                                  })
                    }
                />
            )}
            {customS3Configs.map(customConfig => (
                <S3ConfigCard
                    key={customConfig.id}
                    url={customConfig.url}
                    region={customConfig.region}
                    workingDirectoryPath={customConfig.workingDirectoryPath}
                    pathStyleAccess={customConfig.pathStyleAccess}
                    isUsedForExplorer={customConfig.isUsedForExplorer}
                    isUsedForXOnyxia={customConfig.isUsedForXOnyxia}
                    credentials={{
                        "accessKeyId": customConfig.accessKeyId,
                        "secretAccessKey": customConfig.secretAccessKey,
                        "sessionToken": customConfig.sessionToken
                    }}
                    onDelete={() =>
                        evtConfirmCustomS3ConfigDeletionDialogOpen.post({
                            "resolveDoProceed": doProceed => {
                                if (!doProceed) {
                                    return;
                                }

                                s3ConfigManagement.deleteCustomS3Config({
                                    "customS3ConfigId": customConfig.id
                                });
                            }
                        })
                    }
                    onIsUsedForExplorerValueChange={isUsed =>
                        s3ConfigManagement.setConfigUsage({
                            "customS3ConfigId": customConfig.id,
                            "usedFor": "explorer",
                            isUsed
                        })
                    }
                    onIsUsedForXOnyxiaValueChange={isUsed =>
                        s3ConfigManagement.setConfigUsage({
                            "customS3ConfigId": customConfig.id,
                            "usedFor": "xOnyxia",
                            isUsed
                        })
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
