import { useCore, useCoreState } from "core";
import { Button } from "onyxia-ui/Button";
import { FormFieldGroupComponent } from "ui/pages/launcher/RootFormComponent/FormFieldGroupComponent";
//import { RootFormComponent } from "ui/pages/launcher/RootFormComponent/RootFormComponent";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";

export default function UserProfileForm() {
    const { userProfileForm } = useCore().functions;

    const { rootForm, isThereThingsToSave } = useCoreState("userProfileForm", "main");

    const { t } = useTranslation({ UserProfileForm });

    return (
        <>
            <SettingSectionHeader
                title={t("customizable profile")}
                helperText={t("customizable profile helper")}
            />

            {/*
            <RootFormComponent
                rootForm={rootForm}
                callbacks={{
                    onAdd: ({ helmValuesPath }) =>
                        userProfileForm.addArrayItem({ valuesPath: helmValuesPath }),
                    onChange: params => userProfileForm.changeFormFieldValue(params),
                    onRemove: ({ helmValuesPath, index }) =>
                        userProfileForm.removeArrayItem({
                            valuesPath: helmValuesPath,
                            index
                        }),
                    onFieldErrorChange: params => {
                        console.log("error", params);
                    }
                }}
            />
            */}
            <FormFieldGroupComponent
                helmValuesPath={[]}
                nodes={rootForm.main}
                canAdd={false}
                canRemove={false}
                callbacks={{
                    onAdd: ({ helmValuesPath }) =>
                        userProfileForm.addArrayItem({ valuesPath: helmValuesPath }),
                    onChange: params => userProfileForm.changeFormFieldValue(params),
                    onRemove: ({ helmValuesPath, index }) =>
                        userProfileForm.removeArrayItem({
                            valuesPath: helmValuesPath,
                            index
                        }),
                    onFieldErrorChange: () => {}
                }}
            />

            <div>
                <Button
                    variant="primary"
                    onClick={() => userProfileForm.save()}
                    disabled={!isThereThingsToSave}
                >
                    Save
                </Button>
                <Button
                    variant="ternary"
                    onClick={() => userProfileForm.restore()}
                    disabled={!isThereThingsToSave}
                >
                    Restore
                </Button>
            </div>
        </>
    );
}

const { i18n } = declareComponentKeys<
    "customizable profile" | "customizable profile helper"
>()({
    UserProfileForm
});
export type I18n = typeof i18n;
