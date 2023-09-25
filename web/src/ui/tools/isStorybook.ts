/** true if the current runtime is storybook */
export const isStorybook = "__STORYBOOK_ADDONS" in window.window ?? {};
