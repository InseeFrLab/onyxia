import { IconButton } from "onyxia-ui/IconButton";
import { getIconUrlByName } from "lazy-icons";
import { Tooltip } from "onyxia-ui/Tooltip";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    className?: string;
    isAutoInjected: boolean;
    onChange: (isAutoInjected: boolean) => void;
};

export function AutoInjectSwitch(props: Props) {
    const { className, isAutoInjected, onChange } = props;

    const { t } = useTranslation({ AutoInjectSwitch });

    return (
        <Tooltip title={t("tooltip", { isAutoInjected })}>
            <IconButton
                className={className}
                onClick={() => onChange(!isAutoInjected)}
                icon={getIconUrlByName(isAutoInjected ? "Power" : "PowerOff")}
                size="extra small"
            />
        </Tooltip>
    );
}

const { i18n } = declareComponentKeys<{
    K: "tooltip";
    P: { isAutoInjected: boolean };
    R: JSX.Element;
}>()({ AutoInjectSwitch });
export type I18n = typeof i18n;
