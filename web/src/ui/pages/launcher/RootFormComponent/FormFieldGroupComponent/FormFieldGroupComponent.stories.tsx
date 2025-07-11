import type { Meta, StoryObj } from "@storybook/react";
import { FormFieldGroupComponent } from "./FormFieldGroupComponent";
import { action } from "@storybook/addon-actions";
import type { FormField } from "core/usecases/launcher/decoupledLogic/formTypes";
import { id } from "tsafe/id";

const meta = {
    title: "pages/Launcher/FormFieldGroupComponent",
    component: FormFieldGroupComponent
} satisfies Meta<typeof FormFieldGroupComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChange = action("onChange");
const onAdd = action("onAdd");
const onRemove = action("onRemove");
const onFieldErrorChange = action("onFieldErrorChange");

const helmValuesPath = ["foo", "title"];

export const Default: Story = {
    args: {
        helmValuesPath,
        canAdd: true,
        canRemove: true,
        nodes: [
            id<FormField.TextField>({
                type: "field",
                fieldType: "text field",
                title: "Title 1",
                isReadonly: false,
                helmValuesPath: [1],
                description: "Description 1",
                doRenderAsTextArea: false,
                isSensitive: false,
                pattern: undefined,
                value: "value 1",
                autocomplete: undefined
            }),
            id<FormField.TextField>({
                type: "field",
                fieldType: "text field",
                title: "Title 2",
                isReadonly: false,
                helmValuesPath: [2],
                description: "Description 2",
                doRenderAsTextArea: false,
                isSensitive: false,
                pattern: undefined,
                value: "value 2",
                autocomplete: undefined
            })
        ],
        callbacks: {
            onChange,
            onAdd,
            onRemove,
            onFieldErrorChange
        }
    }
};
