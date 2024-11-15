import { memo } from "react";
import { ButtonBar } from "onyxia-ui/ButtonBar";
import { getIconUrlByName } from "lazy-icons";
import { Icon } from "onyxia-ui/Icon";
import { assert } from "tsafe/assert";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type Props = {
    className?: string;
    monitoringUrl: string | undefined;
    onClickBack: () => void;
    areHelmValuesShown: boolean;
    onClickHelmValues: () => void;
};

export const MyServiceButtonBar = memo((props: Props) => {
    const {
        className,
        monitoringUrl,
        onClickBack,
        areHelmValuesShown,
        onClickHelmValues
    } = props;

    const { t } = useTranslation({ MyServiceButtonBar });

    return (
        <ButtonBar
            className={className}
            buttons={[
                {
                    buttonId: "back",
                    icon: getIconUrlByName("ArrowBack"),
                    label: t("back")
                },
                ...(monitoringUrl === undefined
                    ? []
                    : [
                          {
                              buttonId: "monitoring",
                              icon: getIconUrlByName("Equalizer"),
                              label: (
                                  <span>
                                      {t("external monitoring")}&nbsp;
                                      <Icon
                                          size="extra small"
                                          icon={getIconUrlByName("OpenInNew")}
                                      />{" "}
                                  </span>
                              )
                          }
                      ]),
                {
                    buttonId: "helmValues",
                    icon: getIconUrlByName("Code"),
                    label: areHelmValuesShown ? t("reduce") : t("helm values")
                }
            ]}
            onClick={buttonId => {
                switch (buttonId) {
                    case "back":
                        onClickBack();
                        break;
                    case "monitoring":
                        assert(monitoringUrl !== undefined);
                        window.open(monitoringUrl!);
                        break;
                    case "helmValues":
                        onClickHelmValues();
                        break;
                }
            }}
        />
    );
});

const { i18n } = declareComponentKeys<
    "back" | "external monitoring" | "reduce" | "helm values"
>()({ MyServiceButtonBar });
export type I18n = typeof i18n;
