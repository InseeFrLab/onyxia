import { useState, memo } from "react";
import type { FormFieldValue } from "core/usecases/launcher/FormField";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useEvt } from "evt/hooks";
import { Dialog } from "onyxia-ui/Dialog";
import { Markdown } from "onyxia-ui/Markdown";
import { Button } from "onyxia-ui/Button";
import { symToStr } from "tsafe/symToStr";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { assert } from "tsafe/assert";

export type Props = {
    evtOpen: NonPostableEvt<{
        sensitiveConfigurations: FormFieldValue[];
        resolveDoProceedToLaunch: (doProceedToLaunch: boolean) => void;
    }>;
};

export const SensitiveConfigurationDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ SensitiveConfigurationDialog });

    const [state, setState] = useState<UnpackEvt<typeof evtOpen> | undefined>(undefined);

    useEvt(ctx => evtOpen.attach(ctx, setState), [evtOpen]);

    const onCloseFactory = useCallbackFactory(([doProceedToLaunch]: [boolean]) => {
        assert(state !== undefined);
        state.resolveDoProceedToLaunch(doProceedToLaunch);
        setState(undefined);
    });

    return (
        <Dialog
            isOpen={state !== undefined}
            title={t("sensitive configuration dialog title")}
            body={
                <>
                    {state === undefined
                        ? null
                        : state.sensitiveConfigurations.map(({ path, value }) => (
                              <Markdown key={path.join()}>{`**${path.join(
                                  "."
                              )}**: \`${value}\``}</Markdown>
                          ))}
                </>
            }
            buttons={
                <>
                    <Button onClick={onCloseFactory(false)} variant="secondary">
                        {t("cancel")}
                    </Button>
                    <Button autoFocus onClick={onCloseFactory(true)}>
                        {t("proceed to launch")}
                    </Button>
                </>
            }
            onClose={onCloseFactory(false)}
        />
    );
});

SensitiveConfigurationDialog.displayName = symToStr({ SensitiveConfigurationDialog });

export const { i18n } = declareComponentKeys<
    "sensitive configuration dialog title" | "cancel" | "proceed to launch"
>()({ SensitiveConfigurationDialog });
