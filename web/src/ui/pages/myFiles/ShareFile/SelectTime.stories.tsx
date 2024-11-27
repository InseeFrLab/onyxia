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
        const [expirationValue, setExpirationValue] = useState<number>(
            args.validityDurationSecond
        );

        const handleExpirationValueChange = (props: {
            validityDurationSecond: number;
        }) => {
            const { validityDurationSecond } = props;
            setExpirationValue(validityDurationSecond);
        };

        return (
            <SelectTime
                {...args}
                validityDurationSecond={expirationValue}
                onChangeShareSelectedValidityDuration={handleExpirationValueChange}
            />
        );
    },
    args: {
        validityDurationSecondOptions: [3600, 7200, 10800] // Example options: 1h, 2h, 3h
    }
};
