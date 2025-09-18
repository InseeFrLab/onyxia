/*
In this file we export utilities for using the core in a React setup.  
This file is the only place in src/core where it's okay to assume we are 
using react.  
If we where to change our UI framework we would only update this file to
export an API more adapted to our new front. (But we don't plan to leave React)
*/

import { createReactApi } from "clean-architecture/react";
import { bootstrapCore } from "./bootstrap";
export { type Language, type LocalizedString } from "./ports/OnyxiaApi";

export const { triggerCoreBootstrap, useCoreState, getCoreSync, getCore } =
    createReactApi({
        bootstrapCore
    });
