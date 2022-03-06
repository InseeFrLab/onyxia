import { useRef, memo } from "react";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
//import { useConstCallback } from "powerhooks/useConstCallback";

//Look in my-files.component.tsx
export type InputFileProps = {
    evtAction: NonPostableEvt<"TRIGGER">;
    onFileSelected: () => void;
};

export const InputFile = memo((props: InputFileProps) => {
    const { evtAction } = props;

    const ref = useRef<HTMLInputElement>(null);

    useEvt(
        ctx =>
            evtAction.pipe(ctx).attach(
                action => action === "TRIGGER",
                () => {
                    const element = ref.current;

                    assert(element !== null);

                    element.click();
                },
            ),
        [evtAction],
    );

    /*
	handleChangeFile = (e: { target: { value: string; files: FileList | null } }) => {
		assert(e.target.files !== null);

		this.setState({
			"files": Object.values(e.target.files),
			"filePath": e.target.value,
		});
	};
	*/

    return (
        <input
            aria-hidden="true"
            type="file"
            multiple={true}
            style={{ "display": "none" }}
            ref={ref}
            onChange={() => {}}
        />
    );
});
