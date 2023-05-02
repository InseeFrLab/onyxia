import { ComponentStory, ComponentMeta } from "@storybook/react";
import { createPageStory } from "keycloak-theme/login/createPageStory";

const { PageStory } = createPageStory({
    "pageId": "login-update-profile.ftl"
});

export default {
    "title": "keycloak-theme/login/LoginUpdateProfile",
    "component": PageStory
} as ComponentMeta<typeof PageStory>;

export const Default: ComponentStory<typeof PageStory> = () => <PageStory />;
