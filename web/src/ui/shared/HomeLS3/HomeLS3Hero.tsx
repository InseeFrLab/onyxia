import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { PUBLIC_URL } from "env";

type Props = {
    className?: string;
    userDisplayName: string;
};

export function HomeLS3Hero(props: Props) {
    const { className, userDisplayName } = props;

    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <img src={`${PUBLIC_URL}custom-resources-example/ls3/assets/ls3-logo.png`} />
            <div className={classes.textWrap}>
                <Text typo="object heading">Bienvenu {userDisplayName}</Text>
                <Text typo="subtitle">
                    Demare ton service en quelque clicks et profite de la puissance de
                    calcule de nos serveurs.
                </Text>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ HomeLS3Hero }).create(() => ({
    root: {
        display: "flex"
    },
    textWrap: {
        flex: 1
    }
}));
