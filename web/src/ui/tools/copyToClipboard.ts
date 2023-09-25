import { assert } from "tsafe/assert";

export const copyToClipboard = (str: string) => {
    Promise.resolve().then(() => {
        const textArea = document.createElement("textarea");
        textArea.value = str;
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand("copy");
            assert(!!successful);
        } catch (err) {
            alert("Unable to copy value , error : " + (err as Error).message);
        }

        document.body.removeChild(textArea);
    });
};
