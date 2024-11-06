import { injectDomDependencies } from "@codemirror/view";
import { performActionWithoutScreenScaler } from "screen-scaler";
import GenericCodeEditor, { type Props } from "./GenericCodeEditor";

injectDomDependencies({
    getResizeObserver: () => performActionWithoutScreenScaler(() => ResizeObserver),
    getBoundingClientRect_Element: element =>
        performActionWithoutScreenScaler(() => element.getBoundingClientRect()),
    getBoundingClientRect_Range: range =>
        performActionWithoutScreenScaler(() => range.getBoundingClientRect()),
    getClientRects_Element: element =>
        performActionWithoutScreenScaler(() => element.getClientRects()),
    getClientRects_Range: range =>
        performActionWithoutScreenScaler(() => range.getClientRects()),
    getMouseEventClientXOrY: (event, axis) =>
        performActionWithoutScreenScaler(() => {
            switch (axis) {
                case "x":
                    return event.clientX;
                case "y":
                    return event.clientY;
            }
        })
});

export default function GenericCodeEditorWithScreenScaler(props: Props) {
    return <GenericCodeEditor {...props} />;
}
