import { getIconUrlByName } from "lazy-icons";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";

type Props = {
    className?: string;
    label: string;
    onClick: () => void;
};

/** Laid out like a `ProviderCard` so that it can take place in the providers grid. */
export function AddCustomProviderButton(props: Props) {
    const { className, label, onClick } = props;

    const { classes, cx } = useStyles();

    return (
        <button type="button" className={cx(classes.root, className)} onClick={onClick}>
            <Icon icon={getIconUrlByName("Add")} size="default" />
            <Text typo="object heading" htmlComponent="span">
                {label}
            </Text>
        </button>
    );
}

const useStyles = tss.withName({ AddCustomProviderButton }).create(({ theme }) => ({
    root: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(4),
        width: "100%",
        boxSizing: "border-box",
        padding: theme.spacing(4),
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        borderRadius: theme.spacing(3),
        color: theme.colors.useCases.typography.textPrimary,
        backgroundColor: "transparent",
        textAlign: "left",
        cursor: "pointer",
        "&:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        "&:focus-visible": {
            outline: `2px solid ${theme.colors.useCases.buttons.actionActive}`,
            outlineOffset: 2
        }
    }
}));
