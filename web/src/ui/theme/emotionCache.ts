import { createCssAndCx } from "tss-react/cssAndCx";
import createCache from "@emotion/cache";

export const emotionCache = createCache({
    key: "tss"
});

export const { css, cx } = createCssAndCx({ cache: emotionCache });
