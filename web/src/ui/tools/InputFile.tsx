import { useRef, memo } from "react";
import type { ChangeEventHandler } from "react";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
import { useConstCallback } from "powerhooks/useConstCallback";

//Look in my-files.component.tsx
export type InputFileProps = {
    evtAction: NonPostableEvt<"TRIGGER">;
    onFileSelected: (params: { files: File[] }) => void;
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

            onFileSelected({ files: Object.values(files) });
        }
    );

    return (
        <input
            aria-hidden="true"
            type="file"
            multiple={true}
            style={{ display: "none" }}
            ref={ref}
            onChange={onChange}
        />
    );
});
