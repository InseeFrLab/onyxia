import { useConstCallback } from "powerhooks/useConstCallback";
import { useEffect } from "react";

export function useOnOpenBrowserSearch(onOpenSearch: () => void) {
    const onOpenSearchConst = useConstCallback(onOpenSearch);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Check for Ctrl + F on Windows/Linux or Command + F on macOS
            if ((event.ctrlKey || event.metaKey) && event.key === "f") {
                onOpenSearchConst();
            }
        };

        window.addEventListener("keydown", handleKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, []);
}
