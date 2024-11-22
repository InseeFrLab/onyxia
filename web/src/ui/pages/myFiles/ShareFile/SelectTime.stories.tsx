import { Meta, StoryObj } from "@storybook/react";
import { SelectTime } from "./SelectTime";
import { useState } from "react";

const meta: Meta<typeof SelectTime> = {
    title: "Pages/MyFiles/ShareFile/SelectTime",
    component: SelectTime
};

export default meta;

type Story = StoryObj<typeof SelectTime>;

export const Default: Story = {
    render: args => {
        const [expirationValue, setExpirationValue] = useState(
            args.validityDurationSecondOptions[0]
        );

        const handleExpirationValueChange = (newValue: number) => {
            console.log("Expiration value changed to:", newValue);
            setExpirationValue(newValue);
        };

        return (
            <SelectTime
                {...args}
                expirationValue={expirationValue}
                onExpirationValueChange={handleExpirationValueChange}
            />
        );
    },
    args: {
        className: "",
        validityDurationSecondOptions: [3600, 7200, 10800] // Example options: 1h, 2h, 3h
    }
};
