import { themeProviderWithoutSplashScreen } from "ui/theme";
import { componentByIconId } from "ui/theme/icons";
import { createTss } from "tss-react";
import { createIcon } from "onyxia-ui/Icon";
import { createIconButton } from "onyxia-ui/IconButton";
import { createButton } from "onyxia-ui/Button";
import { createText } from "onyxia-ui/Text";

const { ThemeProvider, useTheme } = themeProviderWithoutSplashScreen;

export { ThemeProvider };

export const { tss } = createTss({
    "useContext": function useContext() {
        const theme = useTheme();
        return { theme };
    }
});

export const useStyles = tss.create({});

/** @see: <https://next.material-ui.com/components/material-icons/> */
export const { Icon } = createIcon(componentByIconId);
export const { IconButton } = createIconButton({ Icon });
export const { Button } = createButton({ Icon });
export const { Text } = createText({ useTheme });
