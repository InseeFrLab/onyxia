import { memo, useId } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { CodeTextEditor } from "../CodeTextEditor";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type Props = {
    isOpen: boolean;
    onClose: () => void;
    jsonSchemaStr: string;
};

export const JsonSchemaDialog = memo((props: Props) => {
    const { isOpen, onClose, jsonSchemaStr } = props;
    const { t } = useTranslation({ JsonSchemaDialog });

    const id_editor = useId();

    return (
        <Dialog
            title={t("json schema")}
            isOpen={isOpen}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            body={
                <CodeTextEditor
                    id={id_editor}
                    language="JSON"
                    value={jsonSchemaStr}
                    onChange={undefined}
                />
            }
            buttons={<Button onClick={onClose}>{t("ok")}</Button>}
        />
    );
});

const { i18n } = declareComponentKeys<"json schema" | "ok">()({
    JsonSchemaDialog
});
export type I18n = typeof i18n;
