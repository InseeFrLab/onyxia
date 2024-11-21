import { defaultPalette } from "onyxia-ui";
import { env } from "env";
import { mergeDeep } from "ui/tools/mergeDeep";

export const palette = mergeDeep(
    {
        ...defaultPalette,
        limeGreen: {
            main: "#BAFF29",
            light: "#E2FFA6"
        },
        agentConnectBlue: {
            main: "#0579EE",
            light: "#2E94FA",
            lighter: "#E5EDF5"
        }
    },
    env.PALETTE_OVERRIDE
);
