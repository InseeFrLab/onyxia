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
            <img
                className={classes.img}
                src={`${PUBLIC_URL}custom-resources/assets/onyxia-logo-LS3-normal.png`}
            />
            <div className={classes.textWrap}>
                <div>
                    <Text typo="page heading">Bienvenu {userDisplayName}</Text>
                    <Text className={classes.subtitle} typo="navigation label">
                        Demare ton service en quelque clicks et profite de la puissance de
                        calcule de nos serveurs.
                    </Text>
                </div>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ HomeLS3Hero }).create(({ theme }) => ({
    root: {
        display: "flex"
    },
    img: {
        height: 110,
        margin: theme.spacing(4)
    },
    textWrap: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
    },
    subtitle: {
        maxWidth: 500,
        color: theme.colors.useCases.typography.textTertiary
    }
}));
