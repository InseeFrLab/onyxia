import { memo } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";

export type Props = {
    isOpen: boolean;
    onClose: () => void;
    jsonSchemaStr: string;
};

export const JsonSchemaDialog = memo((props: Props) => {
    const { isOpen, onClose, jsonSchemaStr } = props;

    return (
        <Dialog
            title="JSON Schema"
            isOpen={isOpen}
            onClose={onClose}
            //fullWidth
            maxWidth="lg"
            body={<pre>{jsonSchemaStr}</pre>}
            buttons={<Button onClick={onClose}>Ok</Button>}
        />
    );
});
