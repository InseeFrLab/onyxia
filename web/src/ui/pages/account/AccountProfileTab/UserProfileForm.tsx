import { useCore, useCoreState } from "core";
import { Button } from "onyxia-ui/Button";
import { FormFieldGroupComponent } from "ui/pages/launcher/RootFormComponent/FormFieldGroupComponent";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { getIconUrlByName } from "lazy-icons";
import Divider from "@mui/material/Divider";
import { assert } from "tsafe/assert";

export default function UserProfileForm() {
    const { userProfileForm } = useCore().functions;

    const { rootForm, isThereThingsToSave } = useCoreState("userProfileForm", "main");

    const { t } = useTranslation({ UserProfileForm });

    const { classes } = useStyles({ isThereThingsToSave });

    return (
        <>
            <Divider sx={{ my: 5 }} />
            <SettingSectionHeader
                title={t("customizable profile")}
                helperText={t("customizable profile helper")}
                className={classes.header}
            />
            <FormFieldGroupComponent
                helmValuesPath={[]}
                nodes={rootForm.main}
                canAdd={false}
                canRemove={false}
                callbacks={{
                    onAdd: ({ helmValuesPath }) =>
                        userProfileForm.addArrayItem({ valuesPath: helmValuesPath }),
                    onChange: ({ formFieldValue }) =>
                        userProfileForm.changeFormFieldValue(formFieldValue),
                    onRemove: ({ helmValuesPath, index }) =>
                        userProfileForm.removeArrayItem({
                            valuesPath: helmValuesPath,
                            index
                        }),
                    onFieldErrorChange: () => {},
                    onAutocompletePanelOpen: () => {
                        assert(false);
                    },
                    onIsAutoInjectedChange: ({ helmValuesPath, isAutoInjected }) =>
                        userProfileForm.onIsAutoInjectedChange({
                            valuesPath: helmValuesPath,
                            isAutoInjected
                        })
                }}
            />
            <div className={classes.buttonWrapper}>
                <Button
                    variant="primary"
                    onClick={() => userProfileForm.save()}
                    disabled={!isThereThingsToSave}
                >
                    {t("save")}
                </Button>
                <Button
                    variant="ternary"
                    onClick={() => userProfileForm.restore()}
                    disabled={!isThereThingsToSave}
                    startIcon={getIconUrlByName("SettingsBackupRestore")}
                >
                    {t("restore")}
                </Button>
            </div>
        </>
    );
}

const useStyles = tss
    .withName({ UserProfileForm })
    .withParams<{
        isThereThingsToSave: boolean;
    }>()
    .create(({ theme, isThereThingsToSave }) => ({
        header: {
            marginBottom: theme.spacing(6)
        },
        buttonWrapper: {
            ...(!isThereThingsToSave
                ? {}
                : {
                      position: "sticky",
                      bottom: theme.spacing(4)
                  }),
            marginTop: theme.spacing(4),
            display: "inline-flex",
            gap: theme.spacing(2),
            backgroundColor: theme.colors.useCases.surfaces.surface1
        }
    }));

const { i18n } = declareComponentKeys<
    "customizable profile" | "customizable profile helper" | "save" | "restore"
>()({
    UserProfileForm
});
export type I18n = typeof i18n;
