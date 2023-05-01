import { ComponentStory, ComponentMeta } from "@storybook/react";
import { createPageStory } from "../createPageStory";

const { PageStory } = createPageStory({
    pageId: "my-extra-page-2.ftl"
});

export default {
    title: "login/MyExtraPage2",
    component: PageStory
} as ComponentMeta<typeof PageStory>;

export const Default: ComponentStory<typeof PageStory> = () => <PageStory />;

export const WitAbc: ComponentStory<typeof PageStory> = () => (
    <PageStory
        kcContext={{
            someCustomValue: "abc"
        }}
    />
);
