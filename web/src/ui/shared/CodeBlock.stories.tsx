import type { Meta, StoryObj } from "@storybook/react";
import CodeBlock from "./CodeBlock";
import { useDarkMode } from "storybook-dark-mode";

const meta = {
    title: "Shared/CodeBlock",
    component: CodeBlock
} satisfies Meta<typeof CodeBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: args => {
        const isDarkModeEnabled = useDarkMode(); // Récupère la valeur du mode sombre
        return <CodeBlock {...args} isDarkModeEnabled={isDarkModeEnabled} />;
    },
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
        // La valeur initiale de `isDarkModeEnabled` est nécessaire pour que Storybook comprenne la prop,
        // mais elle sera surchargée dynamiquement dans la fonction `render`.
        isDarkModeEnabled: false
    },
    parameters: {
        controls: {
            exclude: ["isDarkModeEnabled"] // Exclut la prop du panneau de contrôle si nécessaire
        }
    }
};
