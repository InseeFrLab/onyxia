import { useEffect } from "react";
import { Header } from "app/components/shared/Header";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { sectionName } from "./sectionName";
import { css } from "tss-react";
import { createUseGlobalState } from "powerhooks/useGlobalState";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Header },
});

export default meta;

const width = 1000;

const logoContainerWidth = (width * 4) / 100;
const paddingRight = (width * 2) / 100;

const { useIsCloudShellVisible } = (() => {
    const { useIsCloudShellVisible: useIsCloudShellVisibleSrc } = createUseGlobalState(
        "isCloudShellVisible",
        () => false,
        {
            "persistance": false,
        },
    );

    function useIsCloudShellVisible() {
        const { isCloudShellVisible, setIsCloudShellVisible } =
            useIsCloudShellVisibleSrc();

        useEffect(() => {
            console.log(`isCloudShellVisible set to ${isCloudShellVisible}`);
        }, [isCloudShellVisible]);

        return { isCloudShellVisible, setIsCloudShellVisible };
    }

    return { useIsCloudShellVisible };
})();

export const Vue1 = getStory({
    "className": css({ width, "height": 64, paddingRight }),
    "isUserLoggedIn": false,
    "type": "core",
    useIsCloudShellVisible,
    logoContainerWidth,
    ...logCallbacks(["onLogoClick", "onAuthClick"]),
});

export const Vue2 = getStory({
    "className": css({ width, "height": 64, paddingRight }),
    "type": "keycloak",
    logoContainerWidth,
    ...logCallbacks(["onLogoClick"]),
});
