import { useMemo, useReducer, memo } from "react";
import { useStyles } from "tss";
import { symToStr } from "tsafe/symToStr";
import { useResolveLocalizedString } from "ui/i18n";
import { Alert } from "onyxia-ui/Alert";
import { simpleHash } from "ui/tools/simpleHash";
import { Markdown } from "ui/shared/Markdown";
import { type LocalizedString } from "ui/i18n";

type Props = {
    className?: string;
    // Default value is "info"
    severity: "success" | "info" | "warning" | "error" | undefined;
    message: LocalizedString;
};

const localStorageKeyPrefix = "global-alert-";

export const GlobalAlert = memo((props: Props) => {
    const { className, severity = "info", message } = props;

    const { resolveLocalizedStringDetailed } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
    });

    const localStorageKey = useMemo(() => {
        const { str } = resolveLocalizedStringDetailed(message);

        return `${localStorageKeyPrefix}${simpleHash(severity + str)}-closed`;
    }, [severity, message]);

    const [trigger, pullTrigger] = useReducer(() => ({}), {});

    const isClosed = useMemo(() => {
        // Remove all the local storage keys that are not used anymore.
        for (const key of Object.keys(localStorage)) {
            if (!key.startsWith(localStorageKeyPrefix) || key === localStorageKey) {
                continue;
            }
            localStorage.removeItem(key);
        }

        const value = localStorage.getItem(localStorageKey);

        return value === "true";
    }, [localStorageKey, trigger]);

    const { css, theme } = useStyles();

    return (
        <Alert
            className={className}
            severity={severity}
            doDisplayCross
            isClosed={isClosed}
            onClose={() => {
                localStorage.setItem(localStorageKey, "true");
                pullTrigger();
            }}
        >
            {(() => {
                const { str, langAttrValue } = resolveLocalizedStringDetailed(message);

                const markdownNode = (
                    <Markdown
                        className={css({
                            "&>p": { ...theme.spacing.topBottom("margin", 2) }
                        })}
                    >
                        {str}
                    </Markdown>
                );

                return langAttrValue === undefined ? (
                    markdownNode
                ) : (
                    <div lang={langAttrValue}>{markdownNode}</div>
                );
            })()}
        </Alert>
    );
});

GlobalAlert.displayName = symToStr({ GlobalAlert });
