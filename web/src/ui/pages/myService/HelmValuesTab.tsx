import { tss } from "tss";
import { CodeBlock, atomOneLight, atomOneDark } from "react-code-blocks";

type Props = {
    className?: string;
    formattedHelmValues: string;
};

export function HelmValuesTab(props: Props) {
    const { className, formattedHelmValues } = props;

    const { classes, cx, theme } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <CodeBlock
                language="yaml"
                theme={theme.isDarkModeEnabled ? atomOneDark : atomOneLight}
                text={formattedHelmValues}
                customStyle={{
                    "borderRadius": `${theme.spacing(2)}px`
                }}
            />
        </div>
    );
}

const useStyles = tss.withName({ HelmValuesTab }).create(() => ({
    "root": {
        "height": "100%",
        "overflow": "auto"
    }
}));
