import { memo } from "react";
import { ButtonBar } from "onyxia-ui/ButtonBar";
import { id } from "tsafe/id";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { Icon } from "onyxia-ui/Icon";
import { assert } from "tsafe/assert";

export type Props = {
    className?: string;
    onClickBack: () => void;
    monitoringUrl: string | undefined;
};

export const MyServiceButtonBar = memo((props: Props) => {
    const { className, onClickBack, monitoringUrl } = props;

    return (
        <ButtonBar
            className={className}
            buttons={[
                {
                    "buttonId": "back",
                    "icon": id<MuiIconComponentName>("ArrowBack"),
                    "label": "Back"
                },
                ...(monitoringUrl === undefined
                    ? []
                    : [
                          {
                              "buttonId": "monitoring",
                              "icon": id<MuiIconComponentName>("Equalizer"),
                              "label": (
                                  <span>
                                      {monitoringUrl.toLowerCase().includes("grafana")
                                          ? "Grafana"
                                          : "External"}{" "}
                                      monitoring&nbsp;
                                      <Icon
                                          size="extra small"
                                          icon={id<MuiIconComponentName>("OpenInNew")}
                                      />{" "}
                                  </span>
                              )
                          }
                      ])
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
                }
            }}
        />
    );
});
