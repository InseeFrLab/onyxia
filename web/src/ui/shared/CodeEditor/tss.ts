import { createTss } from "tss-react";
import { useTheme } from "onyxia-ui";
import type { Theme } from "onyxia-ui/lib/theme";

export const { tss } = createTss({
    useContext: function useContext() {
        const theme = useTheme<Theme>();
        return { theme };
    }
});

export const useStyles = tss.create({});
