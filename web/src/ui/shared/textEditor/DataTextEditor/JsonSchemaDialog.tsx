import { memo, useId } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { CodeTextEditor } from "../CodeTextEditor";

export type Props = {
    isOpen: boolean;
    onClose: () => void;
    jsonSchemaStr: string;
};

export const JsonSchemaDialog = memo((props: Props) => {
    const { isOpen, onClose, jsonSchemaStr } = props;

    const id_editor = useId();

    return (
        <Dialog
            title="JSON Schema"
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
            buttons={<Button onClick={onClose}>Ok</Button>}
        />
    );
});
