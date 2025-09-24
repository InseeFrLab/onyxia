import "xterm/css/xterm.css";
import { tss } from "tss";
import { getCoreSync } from "core";
import { withLoader } from "ui/tools/withLoader";
import { enforceLogin } from "ui/shared/enforceLogin";
import { useStyles as useTheme } from "tss";

const Page = withLoader({
    loader: async () => {
        await enforceLogin();
        await getCoreSync().functions.sqlOlapShell.load();
    },
    Component: SqlOlapShell
});
export default Page;

function SqlOlapShell() {
    const { theme } = useTheme();
    const backgroundColor = theme.colors.palette.dark.light;
    const { classes } = useStyles({ backgroundColor });

    const {
        functions: { sqlOlapShell }
    } = getCoreSync();

    return (
        <div className={classes.root}>
            <div
                key={backgroundColor}
                className={classes.duckDbWasmShell}
                ref={element =>
                    sqlOlapShell.setDuckDbWasmShellPlaceholderElement({
                        placeholderElement: element,
                        backgroundColor
                    })
                }
            />
        </div>
    );
}

const useStyles = tss
    .withName({ SqlOlapShell })
    .withParams<{
        backgroundColor: string;
    }>()
    .create(({ theme, backgroundColor }) => ({
        root: {
            height: "100%",
            overflow: "hidden",
            backgroundColor,
            paddingLeft: theme.spacing(3),
            paddingTop: theme.spacing(3),
            borderRadius: theme.spacing(2)
        },
        duckDbWasmShell: {
            height: "100%"
        }
    }));
