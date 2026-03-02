import { memo, useEffect, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { TextField, type TextFieldProps } from "onyxia-ui/TextField";
import { tss } from "tss";
import { Evt } from "evt";
import type { StatefulReadonlyEvt, UnpackEvt } from "evt";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useConst } from "powerhooks/useConst";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";

export type BookmarkNameModalProps = {
    open: boolean;
    initialValue?: string;
    onSave: (label: string) => void;
    onCancel: () => void;
};

export const BookmarkNameModal = memo((props: BookmarkNameModalProps) => {
    const { open, initialValue = "", onSave, onCancel } = props;

    const evtResolve = useConst(() =>
        Evt.create<UnpackEvt<ButtonsProps["evtResolve"]>>(null)
    );

    const onResolveFunctionChanged = useConstCallback<
        BodyProps["onResolveFunctionChanged"]
    >(({ resolve }) => (evtResolve.state = resolve));

    return (
        <Dialog
            title="Name this bookmark"
            isOpen={open}
            onClose={onCancel}
            body={
                open && (
                    <Body
                        initialValue={initialValue}
                        onResolveFunctionChanged={onResolveFunctionChanged}
                        onSave={onSave}
                    />
                )
            }
            buttons={<Buttons evtResolve={evtResolve} onClose={onCancel} />}
        />
    );
});

type BodyProps = {
    initialValue: string;
    onSave: BookmarkNameModalProps["onSave"];
    onResolveFunctionChanged: (params: { resolve: (() => void) | null }) => void;
};

const Body = memo((props: BodyProps) => {
    const { initialValue, onSave, onResolveFunctionChanged } = props;

    const { classes } = useStyles();

    const getIsValidValue = useConstCallback<TextFieldProps["getIsValidValue"]>(value => {
        if (value.trim() === "") {
            return {
                isValidValue: false,
                message: "Label can't be empty"
            };
        }

        return { isValidValue: true };
    });

    const [{ resolve }, setResolve] = useState<{ resolve: (() => void) | null }>({
        resolve: null
    });

    const onValueBeingTypedChange = useConstCallback<
        TextFieldProps["onValueBeingTypedChange"]
    >(({ value, isValidValue }) =>
        setResolve({
            resolve: isValidValue
                ? () => {
                      onSave(value.trim());
                  }
                : null
        })
    );

    useEffect(() => {
        onResolveFunctionChanged({ resolve });
    }, [resolve, onResolveFunctionChanged]);

    const evtAction = useConst(() =>
        Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
    );

    const onEnterKeyDown = useConstCallback<TextFieldProps["onEnterKeyDown"]>(
        ({ preventDefaultAndStopPropagation }) => {
            preventDefaultAndStopPropagation();
            evtAction.post("TRIGGER SUBMIT");
        }
    );

    const onSubmit = useConstCallback<TextFieldProps["onSubmit"]>(() => {
        if (resolve === null) {
            return;
        }

        resolve();
    });

    return (
        <TextField
            inputProps_autoFocus={true}
            inputProps_aria-label="Bookmark name"
            selectAllTextOnFocus={true}
            className={classes.textField}
            defaultValue={initialValue}
            getIsValidValue={getIsValidValue}
            onValueBeingTypedChange={onValueBeingTypedChange}
            evtAction={evtAction}
            onEnterKeyDown={onEnterKeyDown}
            onSubmit={onSubmit}
        />
    );
});

type ButtonsProps = {
    onClose: BookmarkNameModalProps["onCancel"];
    evtResolve: StatefulReadonlyEvt<(() => void) | null>;
};

const Buttons = memo((props: ButtonsProps) => {
    const { onClose, evtResolve } = props;

    useRerenderOnStateChange(evtResolve);

    return (
        <>
            <Button variant="secondary" onClick={onClose}>
                Cancel
            </Button>
            <Button
                onClick={evtResolve.state ?? undefined}
                disabled={evtResolve.state === null}
            >
                Save
            </Button>
        </>
    );
});

const useStyles = tss.withName({ BookmarkNameModal }).create(({ theme }) => ({
    textField: {
        width: 250,
        margin: theme.spacing(5)
    }
}));

// TODO: Add duplicate-name validation and hook this into real bookmark creation rules.
