
import type { NonPostableEvt } from "evt";

export type Props = {

    /** [HIGHER ORDER] */
    getIsValidStrValue(params: { strValue: string; }): boolean;

    isLocked: boolean;

    keyOfSecret: string;
    value: string;
    onEdit(params: {
        editedKey: string | undefined;
        editedStrValue: string | undefined;
    }): void;
    onDelete(): void;
    getResolvedValue(params: { strValue: string; }): string;
    getIsValidAndAvailableKey(params: { key: string; }): boolean;

    evtAction: NonPostableEvt<"ENTER EDITING STATE">;
};

export function MySecretEditorRow(props: Props) {

    return null;
}