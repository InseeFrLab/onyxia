import { useEffect, type ComponentType, type FC } from "react";
import { useCoreState, getCoreSync } from "core";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { tss } from "tss";

export function withLoginEnforced<Props extends Record<string, unknown>>(
    Component: ComponentType<Props>
): FC<Props> {
    function ComponentWithLoginEnforced(props: Props) {
        const {
            functions: { userAuthentication }
        } = getCoreSync();
        const { isUserLoggedIn } = useCoreState("userAuthentication", "main");

        useEffect(() => {
            if (isUserLoggedIn) {
                return;
            }

            userAuthentication.login({ doesCurrentHrefRequiresAuth: true });
        }, []);

        const { classes } = useStyles();

        if (!isUserLoggedIn) {
            return (
                <div className={classes.loginRedirect}>
                    <CircularProgress size={70} />
                </div>
            );
        }

        return <Component {...props} />;
    }

    return ComponentWithLoginEnforced;
}

const useStyles = tss.withName({ withLoginEnforced }).create({
    loginRedirect: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    }
});
