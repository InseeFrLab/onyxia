import { useState, memo } from "react";
import { useStyles } from "tss";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";
import { type NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { Dialog } from "onyxia-ui/Dialog";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { symToStr } from "tsafe/symToStr";
import type { ServiceGitCredentialsError } from "core/usecases/gitProvidersManagement";

export type Props = {
    evtOpen: NonPostableEvt<ServiceGitCredentialsError>;
};

/** "Launch" was clicked but the Git credentials of the service couldn't be obtained */
export const GitCredentialsErrorDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ GitCredentialsErrorDialog });

    const [error, setError] = useState<ServiceGitCredentialsError | undefined>(undefined);

    const { css, theme } = useStyles();

    useEvt(ctx => evtOpen.attach(ctx, error => setError(error)), [evtOpen]);

    const onClose = () => setError(undefined);

    return (
        <Dialog
            isOpen={error !== undefined}
            title={t("title")}
            body={
                error === undefined ? null : (
                    <div className={css({ marginTop: theme.spacing(3) })}>
                        <Text typo="body 2">
                            {t(error.reason, {
                                providerName: error.providerDisplayName
                            })}
                        </Text>
                        {error.detail !== undefined && (
                            <Text
                                typo="body 2"
                                className={css({
                                    marginTop: theme.spacing(2),
                                    fontFamily: "monospace",
                                    wordBreak: "break-word"
                                })}
                            >
                                {error.detail}
                            </Text>
                        )}
                    </div>
                )
            }
            buttons={
                <Button autoFocus onClick={onClose}>
                    {t("ok")}
                </Button>
            }
            onClose={onClose}
        />
    );
});

GitCredentialsErrorDialog.displayName = symToStr({ GitCredentialsErrorDialog });

const { i18n } = declareComponentKeys<
    | "title"
    | { K: "popup blocked"; P: { providerName: string } }
    | { K: "authorization cancelled"; P: { providerName: string } }
    | { K: "authorization denied"; P: { providerName: string } }
    | { K: "sign in required"; P: { providerName: string } }
    | { K: "request failed"; P: { providerName: string } }
    | "ok"
>()({ GitCredentialsErrorDialog });
export type I18n = typeof i18n;
