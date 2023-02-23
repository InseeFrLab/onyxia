import { useEffect, useState } from "react";
import { Header } from "ui/shared/Header";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import { sectionName } from "./sectionName";
import { css } from "@emotion/css";

const defaultContainerWidth = 1200;

function useIsCloudShellVisible() {
    const [isCloudShellVisible, setIsCloudShellVisible] = useState(false);

    useEffect(() => {
        console.log(`isCloudShellVisible set to ${isCloudShellVisible}`);
    }, [isCloudShellVisible]);

    return { isCloudShellVisible, setIsCloudShellVisible };
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Header },
    defaultContainerWidth
});

export default meta;

const propsCommon = {
    "className": css({ "height": 64, "paddingRight": (defaultContainerWidth * 2) / 100 }),
    "logoContainerWidth": (defaultContainerWidth * 4) / 100,
    ...logCallbacks(["onLogoClick"])
};

const propCoreAppCommon = {
    ...propsCommon,
    "isUserLoggedIn": true,
    "useCase": "core app",
    useIsCloudShellVisible
} as const;

export const ViewUserLoggedIn = getStory({
    ...propCoreAppCommon,
    "isUserLoggedIn": true,
    ...logCallbacks(["onLogoutClick", "onSelectedProjectChange"]),
    "projects": [
        {
            "id": "project1",
            "name": "Project 1"
        },
        {
            "id": "project2",
            "name": "Project 2"
        },
        {
            "id": "project3",
            "name": "Project 3"
        }
    ],
    "selectedProjectId": "project2"
});

export const ViewUserNotLoggedIn = getStory({
    ...propCoreAppCommon,
    "isUserLoggedIn": false,
    ...logCallbacks(["onLoginClick"])
});

export const LoginPage = getStory({
    ...propsCommon,
    "useCase": "login pages"
});
