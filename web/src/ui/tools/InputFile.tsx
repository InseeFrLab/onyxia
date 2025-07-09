import { useRef, memo } from "react";
import type { ChangeEventHandler } from "react";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
import { useConstCallback } from "powerhooks/useConstCallback";

export type DroppedItem =
    | { createWhat: "file"; basename: string; blob: File }
    | { createWhat: "directory"; basename: string };

export type InputFileProps = {
    evtAction: NonPostableEvt<"TRIGGER">;
    onFileSelected: (params: { items: DroppedItem[] }) => void;
};

export const InputFile = memo((props: InputFileProps) => {
    const { evtAction, onFileSelected } = props;

    const ref = useRef<HTMLInputElement>(null);

    useEvt(
        ctx =>
            evtAction.pipe(ctx).attach(
                action => action === "TRIGGER",
                () => {
                    const element = ref.current;

                    assert(element !== null);

                    element.click();
                }
            ),
        [evtAction]
    );

    const onChange = useConstCallback<ChangeEventHandler<HTMLInputElement>>(
        ({ target: { files } }) => {
            assert(files !== null);

            const items: DroppedItem[] = Array.from(files).map(file => ({
                createWhat: "file",
                basename: file.webkitRelativePath || file.name,
                blob: file
            }));

            onFileSelected({ items });
        }
    );

    return (
        <input
            aria-hidden="true"
            type="file"
            multiple
            style={{ display: "none" }}
            ref={ref}
            onChange={onChange}
        />
    );
});
