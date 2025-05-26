import { useCore, useCoreState } from "core";
import { Button } from "onyxia-ui/Button";
import { RootFormComponent } from "ui/pages/launcher/RootFormComponent/RootFormComponent";

export default function UserProfileForm() {
    const { userProfileForm } = useCore().functions;

    const { rootForm, isThereThingsToSave } = useCoreState("userProfileForm", "main");

    return (
        <>
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
