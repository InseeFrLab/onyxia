import { useState, memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
import { useCoreState, getCoreSync } from "core";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type MaybeAcknowledgeConfigVolatilityDialogProps = {
    evtOpen: NonPostableEvt<{
        resolve: (params: { doProceed: boolean }) => void;
    }>;
};

type OpenParams = UnpackEvt<MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"]>;

export const MaybeAcknowledgeConfigVolatilityDialog = memo(
    (props: MaybeAcknowledgeConfigVolatilityDialogProps) => {
        const { evtOpen } = props;

        const [openState, setOpenState] = useState<
            | {
                  resolve: OpenParams["resolve"];
              }
            | undefined
        >(undefined);

        const [doNotShowNextTime, setDoNotShowNextTime] = useState(false);

        const { doDisplayAcknowledgeConfigVolatilityDialogIfNoVault } = useCoreState(
            "userConfigs",
            "userConfigs"
        );
        const isVaultEnabled = useCoreState("userConfigs", "isVaultEnabled");

        useEvt(
            ctx => {
                evtOpen.attach(ctx, ({ resolve }) => {
                    if (
                        isVaultEnabled ||
                        !doDisplayAcknowledgeConfigVolatilityDialogIfNoVault
                    ) {
                        resolve({ doProceed: true });
                        return;
                    }

                    setOpenState({
                        resolve
                    });
                });
            },
            [evtOpen, doDisplayAcknowledgeConfigVolatilityDialogIfNoVault, isVaultEnabled]
        );

        const onCancel = () => {
            assert(openState !== undefined);

            openState.resolve({ doProceed: false });

            setOpenState(undefined);
        };

        const {
            functions: { userConfigs }
        } = getCoreSync();

        const { t } = useTranslation({ MaybeAcknowledgeConfigVolatilityDialog });

        return (
            <Dialog
                title={t("dialog title")}
                isOpen={openState !== undefined}
                doNotShowNextTimeText={t("do not show next time")}
                onDoShowNextTimeValueChange={setDoNotShowNextTime}
                onClose={onCancel}
                body={t("dialog body")}
                buttons={
                    <>
                        <Button variant="secondary" onClick={onCancel}>
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={() => {
                                assert(openState !== undefined);

                                if (!doNotShowNextTime) {
                                    userConfigs.changeValue({
                                        key: "doDisplayAcknowledgeConfigVolatilityDialogIfNoVault",
                                        value: false
                                    });
                                }

                                openState.resolve({
                                    doProceed: true
                                });

                                setOpenState(undefined);
                            }}
                        >
                            {t("I understand")}
                        </Button>
                    </>
                }
            />
        );
    }
);

const { i18n } = declareComponentKeys<
    "dialog title" | "dialog body" | "do not show next time" | "cancel" | "I understand"
>()({ MaybeAcknowledgeConfigVolatilityDialog });
export type I18n = typeof i18n;
