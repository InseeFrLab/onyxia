import { createRoot } from "react-dom/client";
import { assert } from "tsafe/assert";
import KcLoginThemePage from "keycloak-theme/login/KcPage";

assert(window.kcContext !== undefined);

createRoot(document.getElementById("root")!).render(
    <KcLoginThemePage kcContext={window.kcContext} />
);
