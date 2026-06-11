
/*
onyxia:
  web:
    env:
      CUSTOM_HTML_HEAD: |
        <script src="%PUBLIC_URL%/custom-resources-example/main.js" type="module"></script>
*/
import { main } from "./ls3/main.js";

/** @typedef {import("../../src/pluginSystem").Onyxia} Onyxia */

window.addEventListener("onyxiaready", () => {
    main(/** @type {Onyxia} */ (window.onyxia));
});
