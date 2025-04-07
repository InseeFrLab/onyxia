import { declareComponentKeys } from "i18nifty";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import CodeBlock from "ui/shared/CodeBlock";
import { RoundLogo } from "ui/shared/RoundLogo";

type Props = {
    helmValues: string;
};

export function HelmTab(props: Props) {
    const { helmValues } = props;

    const { theme } = useStyles();
    // const { t } = useTranslation({ OverviewTab });

    return (
        <div>
            <Text typo="object heading">Values helm</Text>
            <CodeBlock
                initScript={{
                    programmingLanguage: "yaml",
                    scriptCode: helmValues
                }}
                isDarkModeEnabled={theme.isDarkModeEnabled}
            />
        </div>
    );
}

const useStyles = tss.withName({ HelmTab }).create(({ theme }) => ({}));

const { i18n } = declareComponentKeys()({ HelmTab });
