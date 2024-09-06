import type { Meta, StoryObj } from "@storybook/react";
import CodeBlock from "./CodeBlock";

const meta = {
    title: "Shared/CodeBlock",
    component: CodeBlock
} satisfies Meta<typeof CodeBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        initScript: {
            scriptCode: `// A simple function to turn any number of pizzas into happiness
        function pizzaParty(pizzas: number): string {
            if (pizzas <= 0) {
                throw new Error("No pizzas? No party!");
            }
            return "🍕".repeat(pizzas) + " = Happiness!";
        }

        // Let's have a party with 3 pizzas
        console.log(pizzaParty(3));
        // Output: 🍕🍕🍕 = Happiness!`,
            programmingLanguage: "TypeScript"
        },
        isDarkModeEnabled: true
    }
};
