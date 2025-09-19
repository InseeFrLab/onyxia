import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./Root";

{
    const version = import.meta.env.WEB_VERSION;

    console.log(
        [
            `Docker image inseefrlab/onyxia-web version: ${version}`,
            `https://github.com/InseeFrLab/onyxia/tree/web-v${version}/web`
        ].join("\n")
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Root />
    </StrictMode>
);
