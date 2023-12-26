import { MyServicesCards, Props } from "ui/pages/myServices/MyServicesCards";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css } from "@emotion/css";
import { Evt } from "evt";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesCards }
});

export default meta;

const url = "https://example.com";

const props: Props = {
    "className": css({ "width": 300 }),
    "isUpdating": false,
    "cards": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => ({
        "helmReleaseName": `rstudio-${i}`,
        "chartIconUrl": rstudioImgUrl,
        "friendlyName": "My RStudio",
        "chartName": "rstudio",
        "infoUrl": url,
        "openUrl": url + "/" + i,
        "monitoringUrl": url,
        "startTime": Date.now(),
        ...(i % 2 === 0
            ? {
                  "isOwned": false,
                  "isShared": true,
                  "ownerUsername": "jdoe"
              }
            : {
                  "isOwned": true,
                  "isShared": true,
                  "ownerUsername": undefined
              }),
        "vaultTokenExpirationTime": Infinity,
        "s3TokenExpirationTime": Infinity,
        "hasPostInstallInstructions": i % 3 === 0
    })),
    "catalogExplorerLink": { "href": url, "onClick": () => {} },
    "evtAction": new Evt(),
    "projectServicePassword": "abc",
    "getEnv": () => ({
        "foo": "foo value",
        "bar": "bar value",
        "baz": "baz value"
    }),
    "getPostInstallInstructions": () => "Post **install** instructions",
    ...logCallbacks(["onRequestDelete"])
};

export const ViewDefault = getStory({
    ...props,
    "className": css({ "width": 950, "height": 300 })
});
