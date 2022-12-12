import { MyServicesCards, Props } from "ui/components/pages/MyServices/MyServicesCards";
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
    "cards": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => ({
        "serviceId": `rstudio-${i}`,
        "packageIconUrl": rstudioImgUrl,
        "friendlyName": "My RStudio",
        "packageName": "rstudio",
        "infoUrl": url,
        "openUrl": url + "/" + i,

        "monitoringUrl": url,
        "startTime": Date.now(),
        "postInstallInstructions":
            i % 3 === 0 ? `Post install instruction ${i}` : undefined,
        "env": {
            "foo": "foo value",
            "bar": "bar value",
            "baz": "baz value"
        },
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
        "isRenewable": true
    })),
    "catalogExplorerLink": { "href": url, "onClick": () => {} },
    "evtAction": new Evt(),
    "getServicePassword": () => Promise.resolve("xyz"),
    ...logCallbacks(["onRequestDelete", "onRequestRenew"])
};

export const ViewDefault = getStory({
    ...props,
    "className": css({ "width": 950, "height": 300 })
});
