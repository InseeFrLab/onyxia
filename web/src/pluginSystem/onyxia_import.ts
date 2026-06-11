/*
 * This file is the explicit import allowlist exposed to Onyxia plugins.
 *
 * Plugins run outside the main Onyxia bundle and call `onyxia.import("...")` to
 * reuse selected application modules and dependencies. The switch below must
 * stay hardcoded: Vite/Rollup need literal `import("module-name")` calls to know
 * which chunks to create. Do not replace it with a computed dynamic import.
 *
 * When updating this file:
 * - keep `OnyxiaImportModules`, `OnyxiaImportModuleName`, the implementation
 *   argument union, the switch cases, and the returned import paths in sync;
 * - keep `OnyxiaImport` as a named generic function type. `Onyxia.import` uses
 *   this type so vanilla JS plugins annotated with JSDoc get narrowed return
 *   types from calls like `onyxia.import("tsafe")`;
 * - keep the generic overload so return types are narrowed from the requested
 *   module name, e.g. `await onyxia_import("tsafe")`;
 * - preserve the existing Onyxia app aliases (`env`, `core`, `tss`, `ui/*`);
 * - refresh package subpaths from the installed packages:
 *   - `powerhooks`: public `.d.ts` files from `web/node_modules/powerhooks`,
 *     excluding `index`;
 *   - `onyxia-ui`: public package files from `web/node_modules/onyxia-ui`,
 *     excluding `src/*` and `global`;
 *   - `@mui/material`: first-level package directories with both
 *     `package.json` and `index.js`;
 * - keep literal module names exactly equal to their `typeof import("...")` and
 *   runtime `import("...")` paths.
 *
 * Useful validation after edits:
 * - `cd web && npx prettier --write src/pluginSystem/onyxia_import.ts`
 * - `cd web && npx tsc --noEmit`
 * - verify all type-map keys, union members, switch cases, and import targets
 *   are identical sets, and run a Vite resolver check for every runtime import.
 */

import { assert, type Equals } from "tsafe";

export type OnyxiaImportModules = {
    env: typeof import("env");
    core: typeof import("core");
    tss: typeof import("tss");
    "ui/routes": typeof import("ui/routes");
    "ui/i18n": typeof import("ui/i18n");
    "ui/shared/HomeLS3": typeof import("ui/shared/HomeLS3");
    "ui/shared/textEditor/CodeTextEditor": typeof import("ui/shared/textEditor/CodeTextEditor");
    "ui/shared/textEditor/DataTextEditor": typeof import("ui/shared/textEditor/DataTextEditor");
    react: typeof import("react");
    "react-dom": typeof import("react-dom");
    evt: typeof import("evt");
    "tss-react": typeof import("tss-react");
    "evt/hooks": typeof import("evt/hooks");
    "evt/tools/Deferred": typeof import("evt/tools/Deferred");
    tsafe: typeof import("tsafe");
    "powerhooks/getScrollableParent": typeof import("powerhooks/getScrollableParent");
    "powerhooks/tools/capitalize": typeof import("powerhooks/tools/capitalize");
    "powerhooks/tools/isBrowser": typeof import("powerhooks/tools/isBrowser");
    "powerhooks/tools/MaybePromise": typeof import("powerhooks/tools/MaybePromise");
    "powerhooks/tools/memoize0": typeof import("powerhooks/tools/memoize0");
    "powerhooks/tools/pick": typeof import("powerhooks/tools/pick");
    "powerhooks/tools/StatefulObservable/hooks": typeof import("powerhooks/tools/StatefulObservable/hooks");
    "powerhooks/tools/StatefulObservable/hooks/useObservable": typeof import("powerhooks/tools/StatefulObservable/hooks/useObservable");
    "powerhooks/tools/StatefulObservable/hooks/useRerenderOnChange": typeof import("powerhooks/tools/StatefulObservable/hooks/useRerenderOnChange");
    "powerhooks/tools/StatefulObservable": typeof import("powerhooks/tools/StatefulObservable");
    "powerhooks/tools/StatefulObservable/StatefulObservable": typeof import("powerhooks/tools/StatefulObservable/StatefulObservable");
    "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt": typeof import("powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt");
    "powerhooks/tools/updateSearchBar": typeof import("powerhooks/tools/updateSearchBar");
    "powerhooks/tools/urlSearchParams": typeof import("powerhooks/tools/urlSearchParams");
    "powerhooks/tools/useEffectRunConditionToDependencyArray": typeof import("powerhooks/tools/useEffectRunConditionToDependencyArray");
    "powerhooks/tools/waitForDebounce": typeof import("powerhooks/tools/waitForDebounce");
    "powerhooks/useArrayDiff": typeof import("powerhooks/useArrayDiff");
    "powerhooks/useBrowserFontSizeFactor": typeof import("powerhooks/useBrowserFontSizeFactor");
    "powerhooks/useCallbackFactory": typeof import("powerhooks/useCallbackFactory");
    "powerhooks/useClick": typeof import("powerhooks/useClick");
    "powerhooks/useClickAway": typeof import("powerhooks/useClickAway");
    "powerhooks/useConst": typeof import("powerhooks/useConst");
    "powerhooks/useConstCallback": typeof import("powerhooks/useConstCallback");
    "powerhooks/useDebounce": typeof import("powerhooks/useDebounce");
    "powerhooks/useDomRect": typeof import("powerhooks/useDomRect");
    "powerhooks/useEffectIf": typeof import("powerhooks/useEffectIf");
    "powerhooks/useEffectOnValueChange": typeof import("powerhooks/useEffectOnValueChange");
    "powerhooks/useGlobalState": typeof import("powerhooks/useGlobalState");
    "powerhooks/useGuaranteedMemo": typeof import("powerhooks/useGuaranteedMemo");
    "powerhooks/useMergeRefs": typeof import("powerhooks/useMergeRefs");
    "powerhooks/useNamedState": typeof import("powerhooks/useNamedState");
    "powerhooks/useOnLoadMore": typeof import("powerhooks/useOnLoadMore");
    "powerhooks/useScopedState": typeof import("powerhooks/useScopedState");
    "powerhooks/useStateRef": typeof import("powerhooks/useStateRef");
    "powerhooks/useStickyTop": typeof import("powerhooks/useStickyTop");
    "powerhooks/useWindowInnerSize": typeof import("powerhooks/useWindowInnerSize");
    "powerhooks/useWithProps": typeof import("powerhooks/useWithProps");
    "powerhooks/withProps": typeof import("powerhooks/withProps");
    "onyxia-ui/Alert": typeof import("onyxia-ui/Alert");
    "onyxia-ui/BaseBar": typeof import("onyxia-ui/BaseBar");
    "onyxia-ui/Breadcrumb": typeof import("onyxia-ui/Breadcrumb");
    "onyxia-ui/Button": typeof import("onyxia-ui/Button");
    "onyxia-ui/ButtonBar": typeof import("onyxia-ui/ButtonBar");
    "onyxia-ui/ButtonBarButton": typeof import("onyxia-ui/ButtonBarButton");
    "onyxia-ui/Card": typeof import("onyxia-ui/Card");
    "onyxia-ui/Checkbox": typeof import("onyxia-ui/Checkbox");
    "onyxia-ui/CircularProgress": typeof import("onyxia-ui/CircularProgress");
    "onyxia-ui/CollapsibleSectionHeader": typeof import("onyxia-ui/CollapsibleSectionHeader");
    "onyxia-ui/CollapsibleWrapper": typeof import("onyxia-ui/CollapsibleWrapper");
    "onyxia-ui/CopyToClipboardIconButton": typeof import("onyxia-ui/CopyToClipboardIconButton");
    "onyxia-ui/DarkModeSwitch": typeof import("onyxia-ui/DarkModeSwitch");
    "onyxia-ui/Dialog": typeof import("onyxia-ui/Dialog");
    "onyxia-ui/DirectoryHeader": typeof import("onyxia-ui/DirectoryHeader");
    "onyxia-ui/earlyInit": typeof import("onyxia-ui/earlyInit");
    "onyxia-ui/GitHubPicker": typeof import("onyxia-ui/GitHubPicker");
    "onyxia-ui/Icon": typeof import("onyxia-ui/Icon");
    "onyxia-ui/IconButton": typeof import("onyxia-ui/IconButton");
    "onyxia-ui/LanguageSelect": typeof import("onyxia-ui/LanguageSelect");
    "onyxia-ui/LeftBar": typeof import("onyxia-ui/LeftBar");
    "onyxia-ui/lib/breakpoints": typeof import("onyxia-ui/lib/breakpoints");
    "onyxia-ui/lib/color": typeof import("onyxia-ui/lib/color");
    "onyxia-ui/lib/color.urgent": typeof import("onyxia-ui/lib/color.urgent");
    "onyxia-ui/lib/darkMode": typeof import("onyxia-ui/lib/darkMode");
    "onyxia-ui/lib/icon": typeof import("onyxia-ui/lib/icon");
    "onyxia-ui/lib": typeof import("onyxia-ui/lib");
    "onyxia-ui/lib/OnyxiaUi": typeof import("onyxia-ui/lib/OnyxiaUi");
    "onyxia-ui/lib/shadows": typeof import("onyxia-ui/lib/shadows");
    "onyxia-ui/lib/spacing": typeof import("onyxia-ui/lib/spacing");
    "onyxia-ui/lib/SplashScreen": typeof import("onyxia-ui/lib/SplashScreen");
    "onyxia-ui/lib/theme": typeof import("onyxia-ui/lib/theme");
    "onyxia-ui/lib/ThemedAssetUrl": typeof import("onyxia-ui/lib/ThemedAssetUrl");
    "onyxia-ui/lib/tss": typeof import("onyxia-ui/lib/tss");
    "onyxia-ui/lib/typography": typeof import("onyxia-ui/lib/typography");
    "onyxia-ui/Markdown/Code": typeof import("onyxia-ui/Markdown/Code");
    "onyxia-ui/Markdown": typeof import("onyxia-ui/Markdown");
    "onyxia-ui/Markdown/Markdown": typeof import("onyxia-ui/Markdown/Markdown");
    "onyxia-ui/PageHeader": typeof import("onyxia-ui/PageHeader");
    "onyxia-ui/Picker": typeof import("onyxia-ui/Picker");
    "onyxia-ui/RangeSlider": typeof import("onyxia-ui/RangeSlider");
    "onyxia-ui/RangeSlider/RangeSlider": typeof import("onyxia-ui/RangeSlider/RangeSlider");
    "onyxia-ui/RangeSlider/SimpleOrRangeSlider": typeof import("onyxia-ui/RangeSlider/SimpleOrRangeSlider");
    "onyxia-ui/SearchBar": typeof import("onyxia-ui/SearchBar");
    "onyxia-ui/Slider": typeof import("onyxia-ui/Slider");
    "onyxia-ui/Tabs": typeof import("onyxia-ui/Tabs");
    "onyxia-ui/Tag": typeof import("onyxia-ui/Tag");
    "onyxia-ui/Text": typeof import("onyxia-ui/Text");
    "onyxia-ui/TextField": typeof import("onyxia-ui/TextField");
    "onyxia-ui/ThemedImage": typeof import("onyxia-ui/ThemedImage");
    "onyxia-ui/ThemedSvg": typeof import("onyxia-ui/ThemedSvg");
    "onyxia-ui/tools/evtRootFontSizePx": typeof import("onyxia-ui/tools/evtRootFontSizePx");
    "onyxia-ui/tools/evtWindowInnerSize": typeof import("onyxia-ui/tools/evtWindowInnerSize");
    "onyxia-ui/tools/getBrowser": typeof import("onyxia-ui/tools/getBrowser");
    "onyxia-ui/tools/getContrastRatio": typeof import("onyxia-ui/tools/getContrastRatio");
    "onyxia-ui/tools/getIsDarkModeEnabledOsDefault": typeof import("onyxia-ui/tools/getIsDarkModeEnabledOsDefault");
    "onyxia-ui/tools/getSafeUrl": typeof import("onyxia-ui/tools/getSafeUrl");
    "onyxia-ui/tools/LazySvg": typeof import("onyxia-ui/tools/LazySvg");
    "onyxia-ui/tools/memoize": typeof import("onyxia-ui/tools/memoize");
    "onyxia-ui/tools/noUndefined": typeof import("onyxia-ui/tools/noUndefined");
    "onyxia-ui/tools/pxToNumber": typeof import("onyxia-ui/tools/pxToNumber");
    "onyxia-ui/tools/ReactComponent": typeof import("onyxia-ui/tools/ReactComponent");
    "onyxia-ui/tools/useAsync": typeof import("onyxia-ui/tools/useAsync");
    "onyxia-ui/tools/useNonPostableEvtLike": typeof import("onyxia-ui/tools/useNonPostableEvtLike");
    "onyxia-ui/Tooltip": typeof import("onyxia-ui/Tooltip");
    "@mui/material/Accordion": typeof import("@mui/material/Accordion");
    "@mui/material/AccordionActions": typeof import("@mui/material/AccordionActions");
    "@mui/material/AccordionDetails": typeof import("@mui/material/AccordionDetails");
    "@mui/material/AccordionSummary": typeof import("@mui/material/AccordionSummary");
    "@mui/material/Alert": typeof import("@mui/material/Alert");
    "@mui/material/AlertTitle": typeof import("@mui/material/AlertTitle");
    "@mui/material/AppBar": typeof import("@mui/material/AppBar");
    "@mui/material/Autocomplete": typeof import("@mui/material/Autocomplete");
    "@mui/material/Avatar": typeof import("@mui/material/Avatar");
    "@mui/material/AvatarGroup": typeof import("@mui/material/AvatarGroup");
    "@mui/material/Backdrop": typeof import("@mui/material/Backdrop");
    "@mui/material/Badge": typeof import("@mui/material/Badge");
    "@mui/material/BottomNavigation": typeof import("@mui/material/BottomNavigation");
    "@mui/material/BottomNavigationAction": typeof import("@mui/material/BottomNavigationAction");
    "@mui/material/Box": typeof import("@mui/material/Box");
    "@mui/material/Breadcrumbs": typeof import("@mui/material/Breadcrumbs");
    "@mui/material/Button": typeof import("@mui/material/Button");
    "@mui/material/ButtonBase": typeof import("@mui/material/ButtonBase");
    "@mui/material/ButtonGroup": typeof import("@mui/material/ButtonGroup");
    "@mui/material/Card": typeof import("@mui/material/Card");
    "@mui/material/CardActionArea": typeof import("@mui/material/CardActionArea");
    "@mui/material/CardActions": typeof import("@mui/material/CardActions");
    "@mui/material/CardContent": typeof import("@mui/material/CardContent");
    "@mui/material/CardHeader": typeof import("@mui/material/CardHeader");
    "@mui/material/CardMedia": typeof import("@mui/material/CardMedia");
    "@mui/material/Checkbox": typeof import("@mui/material/Checkbox");
    "@mui/material/Chip": typeof import("@mui/material/Chip");
    "@mui/material/CircularProgress": typeof import("@mui/material/CircularProgress");
    "@mui/material/className": typeof import("@mui/material/className");
    "@mui/material/ClickAwayListener": typeof import("@mui/material/ClickAwayListener");
    "@mui/material/Collapse": typeof import("@mui/material/Collapse");
    "@mui/material/colors": typeof import("@mui/material/colors");
    "@mui/material/Container": typeof import("@mui/material/Container");
    "@mui/material/CssBaseline": typeof import("@mui/material/CssBaseline");
    "@mui/material/darkScrollbar": typeof import("@mui/material/darkScrollbar");
    "@mui/material/DefaultPropsProvider": typeof import("@mui/material/DefaultPropsProvider");
    "@mui/material/Dialog": typeof import("@mui/material/Dialog");
    "@mui/material/DialogActions": typeof import("@mui/material/DialogActions");
    "@mui/material/DialogContent": typeof import("@mui/material/DialogContent");
    "@mui/material/DialogContentText": typeof import("@mui/material/DialogContentText");
    "@mui/material/DialogTitle": typeof import("@mui/material/DialogTitle");
    "@mui/material/Divider": typeof import("@mui/material/Divider");
    "@mui/material/Drawer": typeof import("@mui/material/Drawer");
    "@mui/material/Fab": typeof import("@mui/material/Fab");
    "@mui/material/Fade": typeof import("@mui/material/Fade");
    "@mui/material/FilledInput": typeof import("@mui/material/FilledInput");
    "@mui/material/FormControl": typeof import("@mui/material/FormControl");
    "@mui/material/FormControlLabel": typeof import("@mui/material/FormControlLabel");
    "@mui/material/FormGroup": typeof import("@mui/material/FormGroup");
    "@mui/material/FormHelperText": typeof import("@mui/material/FormHelperText");
    "@mui/material/FormLabel": typeof import("@mui/material/FormLabel");
    "@mui/material/generateUtilityClass": typeof import("@mui/material/generateUtilityClass");
    "@mui/material/generateUtilityClasses": typeof import("@mui/material/generateUtilityClasses");
    "@mui/material/GlobalStyles": typeof import("@mui/material/GlobalStyles");
    "@mui/material/Grid": typeof import("@mui/material/Grid");
    "@mui/material/Grid2": typeof import("@mui/material/Grid2");
    "@mui/material/Grow": typeof import("@mui/material/Grow");
    "@mui/material/Hidden": typeof import("@mui/material/Hidden");
    "@mui/material/Icon": typeof import("@mui/material/Icon");
    "@mui/material/IconButton": typeof import("@mui/material/IconButton");
    "@mui/material/ImageList": typeof import("@mui/material/ImageList");
    "@mui/material/ImageListItem": typeof import("@mui/material/ImageListItem");
    "@mui/material/ImageListItemBar": typeof import("@mui/material/ImageListItemBar");
    "@mui/material/InitColorSchemeScript": typeof import("@mui/material/InitColorSchemeScript");
    "@mui/material/Input": typeof import("@mui/material/Input");
    "@mui/material/InputAdornment": typeof import("@mui/material/InputAdornment");
    "@mui/material/InputBase": typeof import("@mui/material/InputBase");
    "@mui/material/InputLabel": typeof import("@mui/material/InputLabel");
    "@mui/material/LinearProgress": typeof import("@mui/material/LinearProgress");
    "@mui/material/Link": typeof import("@mui/material/Link");
    "@mui/material/List": typeof import("@mui/material/List");
    "@mui/material/ListItem": typeof import("@mui/material/ListItem");
    "@mui/material/ListItemAvatar": typeof import("@mui/material/ListItemAvatar");
    "@mui/material/ListItemButton": typeof import("@mui/material/ListItemButton");
    "@mui/material/ListItemIcon": typeof import("@mui/material/ListItemIcon");
    "@mui/material/ListItemSecondaryAction": typeof import("@mui/material/ListItemSecondaryAction");
    "@mui/material/ListItemText": typeof import("@mui/material/ListItemText");
    "@mui/material/ListSubheader": typeof import("@mui/material/ListSubheader");
    "@mui/material/locale": typeof import("@mui/material/locale");
    "@mui/material/Menu": typeof import("@mui/material/Menu");
    "@mui/material/MenuItem": typeof import("@mui/material/MenuItem");
    "@mui/material/MenuList": typeof import("@mui/material/MenuList");
    "@mui/material/MobileStepper": typeof import("@mui/material/MobileStepper");
    "@mui/material/Modal": typeof import("@mui/material/Modal");
    "@mui/material/NativeSelect": typeof import("@mui/material/NativeSelect");
    "@mui/material/NoSsr": typeof import("@mui/material/NoSsr");
    "@mui/material/OutlinedInput": typeof import("@mui/material/OutlinedInput");
    "@mui/material/OverridableComponent": typeof import("@mui/material/OverridableComponent");
    "@mui/material/Pagination": typeof import("@mui/material/Pagination");
    "@mui/material/PaginationItem": typeof import("@mui/material/PaginationItem");
    "@mui/material/Paper": typeof import("@mui/material/Paper");
    "@mui/material/PigmentContainer": typeof import("@mui/material/PigmentContainer");
    "@mui/material/PigmentGrid": typeof import("@mui/material/PigmentGrid");
    "@mui/material/PigmentHidden": typeof import("@mui/material/PigmentHidden");
    "@mui/material/PigmentStack": typeof import("@mui/material/PigmentStack");
    "@mui/material/Popover": typeof import("@mui/material/Popover");
    "@mui/material/Popper": typeof import("@mui/material/Popper");
    "@mui/material/Portal": typeof import("@mui/material/Portal");
    "@mui/material/Radio": typeof import("@mui/material/Radio");
    "@mui/material/RadioGroup": typeof import("@mui/material/RadioGroup");
    "@mui/material/Rating": typeof import("@mui/material/Rating");
    "@mui/material/ScopedCssBaseline": typeof import("@mui/material/ScopedCssBaseline");
    "@mui/material/Select": typeof import("@mui/material/Select");
    "@mui/material/Skeleton": typeof import("@mui/material/Skeleton");
    "@mui/material/Slide": typeof import("@mui/material/Slide");
    "@mui/material/Slider": typeof import("@mui/material/Slider");
    "@mui/material/Snackbar": typeof import("@mui/material/Snackbar");
    "@mui/material/SnackbarContent": typeof import("@mui/material/SnackbarContent");
    "@mui/material/SpeedDial": typeof import("@mui/material/SpeedDial");
    "@mui/material/SpeedDialAction": typeof import("@mui/material/SpeedDialAction");
    "@mui/material/SpeedDialIcon": typeof import("@mui/material/SpeedDialIcon");
    "@mui/material/Stack": typeof import("@mui/material/Stack");
    "@mui/material/Step": typeof import("@mui/material/Step");
    "@mui/material/StepButton": typeof import("@mui/material/StepButton");
    "@mui/material/StepConnector": typeof import("@mui/material/StepConnector");
    "@mui/material/StepContent": typeof import("@mui/material/StepContent");
    "@mui/material/StepIcon": typeof import("@mui/material/StepIcon");
    "@mui/material/StepLabel": typeof import("@mui/material/StepLabel");
    "@mui/material/Stepper": typeof import("@mui/material/Stepper");
    "@mui/material/StyledEngineProvider": typeof import("@mui/material/StyledEngineProvider");
    "@mui/material/styles": typeof import("@mui/material/styles");
    "@mui/material/SvgIcon": typeof import("@mui/material/SvgIcon");
    "@mui/material/SwipeableDrawer": typeof import("@mui/material/SwipeableDrawer");
    "@mui/material/Switch": typeof import("@mui/material/Switch");
    "@mui/material/Tab": typeof import("@mui/material/Tab");
    "@mui/material/Table": typeof import("@mui/material/Table");
    "@mui/material/TableBody": typeof import("@mui/material/TableBody");
    "@mui/material/TableCell": typeof import("@mui/material/TableCell");
    "@mui/material/TableContainer": typeof import("@mui/material/TableContainer");
    "@mui/material/TableFooter": typeof import("@mui/material/TableFooter");
    "@mui/material/TableHead": typeof import("@mui/material/TableHead");
    "@mui/material/TablePagination": typeof import("@mui/material/TablePagination");
    "@mui/material/TableRow": typeof import("@mui/material/TableRow");
    "@mui/material/TableSortLabel": typeof import("@mui/material/TableSortLabel");
    "@mui/material/Tabs": typeof import("@mui/material/Tabs");
    "@mui/material/TabScrollButton": typeof import("@mui/material/TabScrollButton");
    "@mui/material/TextareaAutosize": typeof import("@mui/material/TextareaAutosize");
    "@mui/material/TextField": typeof import("@mui/material/TextField");
    "@mui/material/ToggleButton": typeof import("@mui/material/ToggleButton");
    "@mui/material/ToggleButtonGroup": typeof import("@mui/material/ToggleButtonGroup");
    "@mui/material/Toolbar": typeof import("@mui/material/Toolbar");
    "@mui/material/Tooltip": typeof import("@mui/material/Tooltip");
    "@mui/material/transitions": typeof import("@mui/material/transitions");
    "@mui/material/Typography": typeof import("@mui/material/Typography");
    "@mui/material/Unstable_TrapFocus": typeof import("@mui/material/Unstable_TrapFocus");
    "@mui/material/useAutocomplete": typeof import("@mui/material/useAutocomplete");
    "@mui/material/useLazyRipple": typeof import("@mui/material/useLazyRipple");
    "@mui/material/useMediaQuery": typeof import("@mui/material/useMediaQuery");
    "@mui/material/usePagination": typeof import("@mui/material/usePagination");
    "@mui/material/useScrollTrigger": typeof import("@mui/material/useScrollTrigger");
    "@mui/material/utils": typeof import("@mui/material/utils");
    "@mui/material/version": typeof import("@mui/material/version");
    "@mui/material/zero-styled": typeof import("@mui/material/zero-styled");
    "@mui/material/Zoom": typeof import("@mui/material/Zoom");
};

export type OnyxiaImportModuleName = keyof OnyxiaImportModules;

export type OnyxiaImport = <ModuleName extends OnyxiaImportModuleName>(
    moduleName: ModuleName
) => Promise<OnyxiaImportModules[ModuleName]>;

export function onyxia_import<ModuleName extends OnyxiaImportModuleName>(
    moduleName: ModuleName
): Promise<OnyxiaImportModules[ModuleName]>;

export function onyxia_import(
    moduleName:
        | "env"
        | "core"
        | "tss"
        | "ui/routes"
        | "ui/i18n"
        | "ui/shared/HomeLS3"
        | "ui/shared/textEditor/CodeTextEditor"
        | "ui/shared/textEditor/DataTextEditor"
        | "react"
        | "react-dom"
        | "tss-react"
        | "evt"
        | "evt/hooks"
        | "evt/tools/Deferred"
        | "tsafe"
        | "powerhooks/getScrollableParent"
        | "powerhooks/tools/capitalize"
        | "powerhooks/tools/isBrowser"
        | "powerhooks/tools/MaybePromise"
        | "powerhooks/tools/memoize0"
        | "powerhooks/tools/pick"
        | "powerhooks/tools/StatefulObservable/hooks"
        | "powerhooks/tools/StatefulObservable/hooks/useObservable"
        | "powerhooks/tools/StatefulObservable/hooks/useRerenderOnChange"
        | "powerhooks/tools/StatefulObservable"
        | "powerhooks/tools/StatefulObservable/StatefulObservable"
        | "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt"
        | "powerhooks/tools/updateSearchBar"
        | "powerhooks/tools/urlSearchParams"
        | "powerhooks/tools/useEffectRunConditionToDependencyArray"
        | "powerhooks/tools/waitForDebounce"
        | "powerhooks/useArrayDiff"
        | "powerhooks/useBrowserFontSizeFactor"
        | "powerhooks/useCallbackFactory"
        | "powerhooks/useClick"
        | "powerhooks/useClickAway"
        | "powerhooks/useConst"
        | "powerhooks/useConstCallback"
        | "powerhooks/useDebounce"
        | "powerhooks/useDomRect"
        | "powerhooks/useEffectIf"
        | "powerhooks/useEffectOnValueChange"
        | "powerhooks/useGlobalState"
        | "powerhooks/useGuaranteedMemo"
        | "powerhooks/useMergeRefs"
        | "powerhooks/useNamedState"
        | "powerhooks/useOnLoadMore"
        | "powerhooks/useScopedState"
        | "powerhooks/useStateRef"
        | "powerhooks/useStickyTop"
        | "powerhooks/useWindowInnerSize"
        | "powerhooks/useWithProps"
        | "powerhooks/withProps"
        | "onyxia-ui/Alert"
        | "onyxia-ui/BaseBar"
        | "onyxia-ui/Breadcrumb"
        | "onyxia-ui/Button"
        | "onyxia-ui/ButtonBar"
        | "onyxia-ui/ButtonBarButton"
        | "onyxia-ui/Card"
        | "onyxia-ui/Checkbox"
        | "onyxia-ui/CircularProgress"
        | "onyxia-ui/CollapsibleSectionHeader"
        | "onyxia-ui/CollapsibleWrapper"
        | "onyxia-ui/CopyToClipboardIconButton"
        | "onyxia-ui/DarkModeSwitch"
        | "onyxia-ui/Dialog"
        | "onyxia-ui/DirectoryHeader"
        | "onyxia-ui/earlyInit"
        | "onyxia-ui/GitHubPicker"
        | "onyxia-ui/Icon"
        | "onyxia-ui/IconButton"
        | "onyxia-ui/LanguageSelect"
        | "onyxia-ui/LeftBar"
        | "onyxia-ui/lib/breakpoints"
        | "onyxia-ui/lib/color"
        | "onyxia-ui/lib/color.urgent"
        | "onyxia-ui/lib/darkMode"
        | "onyxia-ui/lib/icon"
        | "onyxia-ui/lib"
        | "onyxia-ui/lib/OnyxiaUi"
        | "onyxia-ui/lib/shadows"
        | "onyxia-ui/lib/spacing"
        | "onyxia-ui/lib/SplashScreen"
        | "onyxia-ui/lib/theme"
        | "onyxia-ui/lib/ThemedAssetUrl"
        | "onyxia-ui/lib/tss"
        | "onyxia-ui/lib/typography"
        | "onyxia-ui/Markdown/Code"
        | "onyxia-ui/Markdown"
        | "onyxia-ui/Markdown/Markdown"
        | "onyxia-ui/PageHeader"
        | "onyxia-ui/Picker"
        | "onyxia-ui/RangeSlider"
        | "onyxia-ui/RangeSlider/RangeSlider"
        | "onyxia-ui/RangeSlider/SimpleOrRangeSlider"
        | "onyxia-ui/SearchBar"
        | "onyxia-ui/Slider"
        | "onyxia-ui/Tabs"
        | "onyxia-ui/Tag"
        | "onyxia-ui/Text"
        | "onyxia-ui/TextField"
        | "onyxia-ui/ThemedImage"
        | "onyxia-ui/ThemedSvg"
        | "onyxia-ui/tools/evtRootFontSizePx"
        | "onyxia-ui/tools/evtWindowInnerSize"
        | "onyxia-ui/tools/getBrowser"
        | "onyxia-ui/tools/getContrastRatio"
        | "onyxia-ui/tools/getIsDarkModeEnabledOsDefault"
        | "onyxia-ui/tools/getSafeUrl"
        | "onyxia-ui/tools/LazySvg"
        | "onyxia-ui/tools/memoize"
        | "onyxia-ui/tools/noUndefined"
        | "onyxia-ui/tools/pxToNumber"
        | "onyxia-ui/tools/ReactComponent"
        | "onyxia-ui/tools/useAsync"
        | "onyxia-ui/tools/useNonPostableEvtLike"
        | "onyxia-ui/Tooltip"
        | "@mui/material/Accordion"
        | "@mui/material/AccordionActions"
        | "@mui/material/AccordionDetails"
        | "@mui/material/AccordionSummary"
        | "@mui/material/Alert"
        | "@mui/material/AlertTitle"
        | "@mui/material/AppBar"
        | "@mui/material/Autocomplete"
        | "@mui/material/Avatar"
        | "@mui/material/AvatarGroup"
        | "@mui/material/Backdrop"
        | "@mui/material/Badge"
        | "@mui/material/BottomNavigation"
        | "@mui/material/BottomNavigationAction"
        | "@mui/material/Box"
        | "@mui/material/Breadcrumbs"
        | "@mui/material/Button"
        | "@mui/material/ButtonBase"
        | "@mui/material/ButtonGroup"
        | "@mui/material/Card"
        | "@mui/material/CardActionArea"
        | "@mui/material/CardActions"
        | "@mui/material/CardContent"
        | "@mui/material/CardHeader"
        | "@mui/material/CardMedia"
        | "@mui/material/Checkbox"
        | "@mui/material/Chip"
        | "@mui/material/CircularProgress"
        | "@mui/material/className"
        | "@mui/material/ClickAwayListener"
        | "@mui/material/Collapse"
        | "@mui/material/colors"
        | "@mui/material/Container"
        | "@mui/material/CssBaseline"
        | "@mui/material/darkScrollbar"
        | "@mui/material/DefaultPropsProvider"
        | "@mui/material/Dialog"
        | "@mui/material/DialogActions"
        | "@mui/material/DialogContent"
        | "@mui/material/DialogContentText"
        | "@mui/material/DialogTitle"
        | "@mui/material/Divider"
        | "@mui/material/Drawer"
        | "@mui/material/Fab"
        | "@mui/material/Fade"
        | "@mui/material/FilledInput"
        | "@mui/material/FormControl"
        | "@mui/material/FormControlLabel"
        | "@mui/material/FormGroup"
        | "@mui/material/FormHelperText"
        | "@mui/material/FormLabel"
        | "@mui/material/generateUtilityClass"
        | "@mui/material/generateUtilityClasses"
        | "@mui/material/GlobalStyles"
        | "@mui/material/Grid"
        | "@mui/material/Grid2"
        | "@mui/material/Grow"
        | "@mui/material/Hidden"
        | "@mui/material/Icon"
        | "@mui/material/IconButton"
        | "@mui/material/ImageList"
        | "@mui/material/ImageListItem"
        | "@mui/material/ImageListItemBar"
        | "@mui/material/InitColorSchemeScript"
        | "@mui/material/Input"
        | "@mui/material/InputAdornment"
        | "@mui/material/InputBase"
        | "@mui/material/InputLabel"
        | "@mui/material/LinearProgress"
        | "@mui/material/Link"
        | "@mui/material/List"
        | "@mui/material/ListItem"
        | "@mui/material/ListItemAvatar"
        | "@mui/material/ListItemButton"
        | "@mui/material/ListItemIcon"
        | "@mui/material/ListItemSecondaryAction"
        | "@mui/material/ListItemText"
        | "@mui/material/ListSubheader"
        | "@mui/material/locale"
        | "@mui/material/Menu"
        | "@mui/material/MenuItem"
        | "@mui/material/MenuList"
        | "@mui/material/MobileStepper"
        | "@mui/material/Modal"
        | "@mui/material/NativeSelect"
        | "@mui/material/NoSsr"
        | "@mui/material/OutlinedInput"
        | "@mui/material/OverridableComponent"
        | "@mui/material/Pagination"
        | "@mui/material/PaginationItem"
        | "@mui/material/Paper"
        | "@mui/material/PigmentContainer"
        | "@mui/material/PigmentGrid"
        | "@mui/material/PigmentHidden"
        | "@mui/material/PigmentStack"
        | "@mui/material/Popover"
        | "@mui/material/Popper"
        | "@mui/material/Portal"
        | "@mui/material/Radio"
        | "@mui/material/RadioGroup"
        | "@mui/material/Rating"
        | "@mui/material/ScopedCssBaseline"
        | "@mui/material/Select"
        | "@mui/material/Skeleton"
        | "@mui/material/Slide"
        | "@mui/material/Slider"
        | "@mui/material/Snackbar"
        | "@mui/material/SnackbarContent"
        | "@mui/material/SpeedDial"
        | "@mui/material/SpeedDialAction"
        | "@mui/material/SpeedDialIcon"
        | "@mui/material/Stack"
        | "@mui/material/Step"
        | "@mui/material/StepButton"
        | "@mui/material/StepConnector"
        | "@mui/material/StepContent"
        | "@mui/material/StepIcon"
        | "@mui/material/StepLabel"
        | "@mui/material/Stepper"
        | "@mui/material/StyledEngineProvider"
        | "@mui/material/styles"
        | "@mui/material/SvgIcon"
        | "@mui/material/SwipeableDrawer"
        | "@mui/material/Switch"
        | "@mui/material/Tab"
        | "@mui/material/Table"
        | "@mui/material/TableBody"
        | "@mui/material/TableCell"
        | "@mui/material/TableContainer"
        | "@mui/material/TableFooter"
        | "@mui/material/TableHead"
        | "@mui/material/TablePagination"
        | "@mui/material/TableRow"
        | "@mui/material/TableSortLabel"
        | "@mui/material/Tabs"
        | "@mui/material/TabScrollButton"
        | "@mui/material/TextareaAutosize"
        | "@mui/material/TextField"
        | "@mui/material/ToggleButton"
        | "@mui/material/ToggleButtonGroup"
        | "@mui/material/Toolbar"
        | "@mui/material/Tooltip"
        | "@mui/material/transitions"
        | "@mui/material/Typography"
        | "@mui/material/Unstable_TrapFocus"
        | "@mui/material/useAutocomplete"
        | "@mui/material/useLazyRipple"
        | "@mui/material/useMediaQuery"
        | "@mui/material/usePagination"
        | "@mui/material/useScrollTrigger"
        | "@mui/material/utils"
        | "@mui/material/version"
        | "@mui/material/zero-styled"
        | "@mui/material/Zoom"
) {
    switch (moduleName) {
        case "env":
            return import("env");
        case "core":
            return import("core");
        case "tss":
            return import("tss");
        case "ui/routes":
            return import("ui/routes");
        case "ui/i18n":
            return import("ui/i18n");
        case "ui/shared/HomeLS3":
            return import("ui/shared/HomeLS3");
        case "ui/shared/textEditor/CodeTextEditor":
            return import("ui/shared/textEditor/CodeTextEditor");
        case "ui/shared/textEditor/DataTextEditor":
            return import("ui/shared/textEditor/DataTextEditor");
        case "react":
            return import("react");
        case "react-dom":
            return import("react-dom");
        case "tss-react":
            return import("tss-react");
        case "evt":
            return import("evt");
        case "evt/hooks":
            return import("evt/hooks");
        case "evt/tools/Deferred":
            return import("evt/tools/Deferred");
        case "tsafe":
            return import("tsafe");
        case "powerhooks/getScrollableParent":
            return import("powerhooks/getScrollableParent");
        case "powerhooks/tools/capitalize":
            return import("powerhooks/tools/capitalize");
        case "powerhooks/tools/isBrowser":
            return import("powerhooks/tools/isBrowser");
        case "powerhooks/tools/MaybePromise":
            return import("powerhooks/tools/MaybePromise");
        case "powerhooks/tools/memoize0":
            return import("powerhooks/tools/memoize0");
        case "powerhooks/tools/pick":
            return import("powerhooks/tools/pick");
        case "powerhooks/tools/StatefulObservable/hooks":
            return import("powerhooks/tools/StatefulObservable/hooks");
        case "powerhooks/tools/StatefulObservable/hooks/useObservable":
            return import("powerhooks/tools/StatefulObservable/hooks/useObservable");
        case "powerhooks/tools/StatefulObservable/hooks/useRerenderOnChange":
            return import(
                "powerhooks/tools/StatefulObservable/hooks/useRerenderOnChange"
            );
        case "powerhooks/tools/StatefulObservable":
            return import("powerhooks/tools/StatefulObservable");
        case "powerhooks/tools/StatefulObservable/StatefulObservable":
            return import("powerhooks/tools/StatefulObservable/StatefulObservable");
        case "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt":
            return import(
                "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt"
            );
        case "powerhooks/tools/updateSearchBar":
            return import("powerhooks/tools/updateSearchBar");
        case "powerhooks/tools/urlSearchParams":
            return import("powerhooks/tools/urlSearchParams");
        case "powerhooks/tools/useEffectRunConditionToDependencyArray":
            return import("powerhooks/tools/useEffectRunConditionToDependencyArray");
        case "powerhooks/tools/waitForDebounce":
            return import("powerhooks/tools/waitForDebounce");
        case "powerhooks/useArrayDiff":
            return import("powerhooks/useArrayDiff");
        case "powerhooks/useBrowserFontSizeFactor":
            return import("powerhooks/useBrowserFontSizeFactor");
        case "powerhooks/useCallbackFactory":
            return import("powerhooks/useCallbackFactory");
        case "powerhooks/useClick":
            return import("powerhooks/useClick");
        case "powerhooks/useClickAway":
            return import("powerhooks/useClickAway");
        case "powerhooks/useConst":
            return import("powerhooks/useConst");
        case "powerhooks/useConstCallback":
            return import("powerhooks/useConstCallback");
        case "powerhooks/useDebounce":
            return import("powerhooks/useDebounce");
        case "powerhooks/useDomRect":
            return import("powerhooks/useDomRect");
        case "powerhooks/useEffectIf":
            return import("powerhooks/useEffectIf");
        case "powerhooks/useEffectOnValueChange":
            return import("powerhooks/useEffectOnValueChange");
        case "powerhooks/useGlobalState":
            return import("powerhooks/useGlobalState");
        case "powerhooks/useGuaranteedMemo":
            return import("powerhooks/useGuaranteedMemo");
        case "powerhooks/useMergeRefs":
            return import("powerhooks/useMergeRefs");
        case "powerhooks/useNamedState":
            return import("powerhooks/useNamedState");
        case "powerhooks/useOnLoadMore":
            return import("powerhooks/useOnLoadMore");
        case "powerhooks/useScopedState":
            return import("powerhooks/useScopedState");
        case "powerhooks/useStateRef":
            return import("powerhooks/useStateRef");
        case "powerhooks/useStickyTop":
            return import("powerhooks/useStickyTop");
        case "powerhooks/useWindowInnerSize":
            return import("powerhooks/useWindowInnerSize");
        case "powerhooks/useWithProps":
            return import("powerhooks/useWithProps");
        case "powerhooks/withProps":
            return import("powerhooks/withProps");
        case "onyxia-ui/Alert":
            return import("onyxia-ui/Alert");
        case "onyxia-ui/BaseBar":
            return import("onyxia-ui/BaseBar");
        case "onyxia-ui/Breadcrumb":
            return import("onyxia-ui/Breadcrumb");
        case "onyxia-ui/Button":
            return import("onyxia-ui/Button");
        case "onyxia-ui/ButtonBar":
            return import("onyxia-ui/ButtonBar");
        case "onyxia-ui/ButtonBarButton":
            return import("onyxia-ui/ButtonBarButton");
        case "onyxia-ui/Card":
            return import("onyxia-ui/Card");
        case "onyxia-ui/Checkbox":
            return import("onyxia-ui/Checkbox");
        case "onyxia-ui/CircularProgress":
            return import("onyxia-ui/CircularProgress");
        case "onyxia-ui/CollapsibleSectionHeader":
            return import("onyxia-ui/CollapsibleSectionHeader");
        case "onyxia-ui/CollapsibleWrapper":
            return import("onyxia-ui/CollapsibleWrapper");
        case "onyxia-ui/CopyToClipboardIconButton":
            return import("onyxia-ui/CopyToClipboardIconButton");
        case "onyxia-ui/DarkModeSwitch":
            return import("onyxia-ui/DarkModeSwitch");
        case "onyxia-ui/Dialog":
            return import("onyxia-ui/Dialog");
        case "onyxia-ui/DirectoryHeader":
            return import("onyxia-ui/DirectoryHeader");
        case "onyxia-ui/earlyInit":
            return import("onyxia-ui/earlyInit");
        case "onyxia-ui/GitHubPicker":
            return import("onyxia-ui/GitHubPicker");
        case "onyxia-ui/Icon":
            return import("onyxia-ui/Icon");
        case "onyxia-ui/IconButton":
            return import("onyxia-ui/IconButton");
        case "onyxia-ui/LanguageSelect":
            return import("onyxia-ui/LanguageSelect");
        case "onyxia-ui/LeftBar":
            return import("onyxia-ui/LeftBar");
        case "onyxia-ui/lib/breakpoints":
            return import("onyxia-ui/lib/breakpoints");
        case "onyxia-ui/lib/color":
            return import("onyxia-ui/lib/color");
        case "onyxia-ui/lib/color.urgent":
            return import("onyxia-ui/lib/color.urgent");
        case "onyxia-ui/lib/darkMode":
            return import("onyxia-ui/lib/darkMode");
        case "onyxia-ui/lib/icon":
            return import("onyxia-ui/lib/icon");
        case "onyxia-ui/lib":
            return import("onyxia-ui/lib");
        case "onyxia-ui/lib/OnyxiaUi":
            return import("onyxia-ui/lib/OnyxiaUi");
        case "onyxia-ui/lib/shadows":
            return import("onyxia-ui/lib/shadows");
        case "onyxia-ui/lib/spacing":
            return import("onyxia-ui/lib/spacing");
        case "onyxia-ui/lib/SplashScreen":
            return import("onyxia-ui/lib/SplashScreen");
        case "onyxia-ui/lib/theme":
            return import("onyxia-ui/lib/theme");
        case "onyxia-ui/lib/ThemedAssetUrl":
            return import("onyxia-ui/lib/ThemedAssetUrl");
        case "onyxia-ui/lib/tss":
            return import("onyxia-ui/lib/tss");
        case "onyxia-ui/lib/typography":
            return import("onyxia-ui/lib/typography");
        case "onyxia-ui/Markdown/Code":
            return import("onyxia-ui/Markdown/Code");
        case "onyxia-ui/Markdown":
            return import("onyxia-ui/Markdown");
        case "onyxia-ui/Markdown/Markdown":
            return import("onyxia-ui/Markdown/Markdown");
        case "onyxia-ui/PageHeader":
            return import("onyxia-ui/PageHeader");
        case "onyxia-ui/Picker":
            return import("onyxia-ui/Picker");
        case "onyxia-ui/RangeSlider":
            return import("onyxia-ui/RangeSlider");
        case "onyxia-ui/RangeSlider/RangeSlider":
            return import("onyxia-ui/RangeSlider/RangeSlider");
        case "onyxia-ui/RangeSlider/SimpleOrRangeSlider":
            return import("onyxia-ui/RangeSlider/SimpleOrRangeSlider");
        case "onyxia-ui/SearchBar":
            return import("onyxia-ui/SearchBar");
        case "onyxia-ui/Slider":
            return import("onyxia-ui/Slider");
        case "onyxia-ui/Tabs":
            return import("onyxia-ui/Tabs");
        case "onyxia-ui/Tag":
            return import("onyxia-ui/Tag");
        case "onyxia-ui/Text":
            return import("onyxia-ui/Text");
        case "onyxia-ui/TextField":
            return import("onyxia-ui/TextField");
        case "onyxia-ui/ThemedImage":
            return import("onyxia-ui/ThemedImage");
        case "onyxia-ui/ThemedSvg":
            return import("onyxia-ui/ThemedSvg");
        case "onyxia-ui/tools/evtRootFontSizePx":
            return import("onyxia-ui/tools/evtRootFontSizePx");
        case "onyxia-ui/tools/evtWindowInnerSize":
            return import("onyxia-ui/tools/evtWindowInnerSize");
        case "onyxia-ui/tools/getBrowser":
            return import("onyxia-ui/tools/getBrowser");
        case "onyxia-ui/tools/getContrastRatio":
            return import("onyxia-ui/tools/getContrastRatio");
        case "onyxia-ui/tools/getIsDarkModeEnabledOsDefault":
            return import("onyxia-ui/tools/getIsDarkModeEnabledOsDefault");
        case "onyxia-ui/tools/getSafeUrl":
            return import("onyxia-ui/tools/getSafeUrl");
        case "onyxia-ui/tools/LazySvg":
            return import("onyxia-ui/tools/LazySvg");
        case "onyxia-ui/tools/memoize":
            return import("onyxia-ui/tools/memoize");
        case "onyxia-ui/tools/noUndefined":
            return import("onyxia-ui/tools/noUndefined");
        case "onyxia-ui/tools/pxToNumber":
            return import("onyxia-ui/tools/pxToNumber");
        case "onyxia-ui/tools/ReactComponent":
            return import("onyxia-ui/tools/ReactComponent");
        case "onyxia-ui/tools/useAsync":
            return import("onyxia-ui/tools/useAsync");
        case "onyxia-ui/tools/useNonPostableEvtLike":
            return import("onyxia-ui/tools/useNonPostableEvtLike");
        case "onyxia-ui/Tooltip":
            return import("onyxia-ui/Tooltip");
        case "@mui/material/Accordion":
            return import("@mui/material/Accordion");
        case "@mui/material/AccordionActions":
            return import("@mui/material/AccordionActions");
        case "@mui/material/AccordionDetails":
            return import("@mui/material/AccordionDetails");
        case "@mui/material/AccordionSummary":
            return import("@mui/material/AccordionSummary");
        case "@mui/material/Alert":
            return import("@mui/material/Alert");
        case "@mui/material/AlertTitle":
            return import("@mui/material/AlertTitle");
        case "@mui/material/AppBar":
            return import("@mui/material/AppBar");
        case "@mui/material/Autocomplete":
            return import("@mui/material/Autocomplete");
        case "@mui/material/Avatar":
            return import("@mui/material/Avatar");
        case "@mui/material/AvatarGroup":
            return import("@mui/material/AvatarGroup");
        case "@mui/material/Backdrop":
            return import("@mui/material/Backdrop");
        case "@mui/material/Badge":
            return import("@mui/material/Badge");
        case "@mui/material/BottomNavigation":
            return import("@mui/material/BottomNavigation");
        case "@mui/material/BottomNavigationAction":
            return import("@mui/material/BottomNavigationAction");
        case "@mui/material/Box":
            return import("@mui/material/Box");
        case "@mui/material/Breadcrumbs":
            return import("@mui/material/Breadcrumbs");
        case "@mui/material/Button":
            return import("@mui/material/Button");
        case "@mui/material/ButtonBase":
            return import("@mui/material/ButtonBase");
        case "@mui/material/ButtonGroup":
            return import("@mui/material/ButtonGroup");
        case "@mui/material/Card":
            return import("@mui/material/Card");
        case "@mui/material/CardActionArea":
            return import("@mui/material/CardActionArea");
        case "@mui/material/CardActions":
            return import("@mui/material/CardActions");
        case "@mui/material/CardContent":
            return import("@mui/material/CardContent");
        case "@mui/material/CardHeader":
            return import("@mui/material/CardHeader");
        case "@mui/material/CardMedia":
            return import("@mui/material/CardMedia");
        case "@mui/material/Checkbox":
            return import("@mui/material/Checkbox");
        case "@mui/material/Chip":
            return import("@mui/material/Chip");
        case "@mui/material/CircularProgress":
            return import("@mui/material/CircularProgress");
        case "@mui/material/className":
            return import("@mui/material/className");
        case "@mui/material/ClickAwayListener":
            return import("@mui/material/ClickAwayListener");
        case "@mui/material/Collapse":
            return import("@mui/material/Collapse");
        case "@mui/material/colors":
            return import("@mui/material/colors");
        case "@mui/material/Container":
            return import("@mui/material/Container");
        case "@mui/material/CssBaseline":
            return import("@mui/material/CssBaseline");
        case "@mui/material/darkScrollbar":
            return import("@mui/material/darkScrollbar");
        case "@mui/material/DefaultPropsProvider":
            return import("@mui/material/DefaultPropsProvider");
        case "@mui/material/Dialog":
            return import("@mui/material/Dialog");
        case "@mui/material/DialogActions":
            return import("@mui/material/DialogActions");
        case "@mui/material/DialogContent":
            return import("@mui/material/DialogContent");
        case "@mui/material/DialogContentText":
            return import("@mui/material/DialogContentText");
        case "@mui/material/DialogTitle":
            return import("@mui/material/DialogTitle");
        case "@mui/material/Divider":
            return import("@mui/material/Divider");
        case "@mui/material/Drawer":
            return import("@mui/material/Drawer");
        case "@mui/material/Fab":
            return import("@mui/material/Fab");
        case "@mui/material/Fade":
            return import("@mui/material/Fade");
        case "@mui/material/FilledInput":
            return import("@mui/material/FilledInput");
        case "@mui/material/FormControl":
            return import("@mui/material/FormControl");
        case "@mui/material/FormControlLabel":
            return import("@mui/material/FormControlLabel");
        case "@mui/material/FormGroup":
            return import("@mui/material/FormGroup");
        case "@mui/material/FormHelperText":
            return import("@mui/material/FormHelperText");
        case "@mui/material/FormLabel":
            return import("@mui/material/FormLabel");
        case "@mui/material/generateUtilityClass":
            return import("@mui/material/generateUtilityClass");
        case "@mui/material/generateUtilityClasses":
            return import("@mui/material/generateUtilityClasses");
        case "@mui/material/GlobalStyles":
            return import("@mui/material/GlobalStyles");
        case "@mui/material/Grid":
            return import("@mui/material/Grid");
        case "@mui/material/Grid2":
            return import("@mui/material/Grid2");
        case "@mui/material/Grow":
            return import("@mui/material/Grow");
        case "@mui/material/Hidden":
            return import("@mui/material/Hidden");
        case "@mui/material/Icon":
            return import("@mui/material/Icon");
        case "@mui/material/IconButton":
            return import("@mui/material/IconButton");
        case "@mui/material/ImageList":
            return import("@mui/material/ImageList");
        case "@mui/material/ImageListItem":
            return import("@mui/material/ImageListItem");
        case "@mui/material/ImageListItemBar":
            return import("@mui/material/ImageListItemBar");
        case "@mui/material/InitColorSchemeScript":
            return import("@mui/material/InitColorSchemeScript");
        case "@mui/material/Input":
            return import("@mui/material/Input");
        case "@mui/material/InputAdornment":
            return import("@mui/material/InputAdornment");
        case "@mui/material/InputBase":
            return import("@mui/material/InputBase");
        case "@mui/material/InputLabel":
            return import("@mui/material/InputLabel");
        case "@mui/material/LinearProgress":
            return import("@mui/material/LinearProgress");
        case "@mui/material/Link":
            return import("@mui/material/Link");
        case "@mui/material/List":
            return import("@mui/material/List");
        case "@mui/material/ListItem":
            return import("@mui/material/ListItem");
        case "@mui/material/ListItemAvatar":
            return import("@mui/material/ListItemAvatar");
        case "@mui/material/ListItemButton":
            return import("@mui/material/ListItemButton");
        case "@mui/material/ListItemIcon":
            return import("@mui/material/ListItemIcon");
        case "@mui/material/ListItemSecondaryAction":
            return import("@mui/material/ListItemSecondaryAction");
        case "@mui/material/ListItemText":
            return import("@mui/material/ListItemText");
        case "@mui/material/ListSubheader":
            return import("@mui/material/ListSubheader");
        case "@mui/material/locale":
            return import("@mui/material/locale");
        case "@mui/material/Menu":
            return import("@mui/material/Menu");
        case "@mui/material/MenuItem":
            return import("@mui/material/MenuItem");
        case "@mui/material/MenuList":
            return import("@mui/material/MenuList");
        case "@mui/material/MobileStepper":
            return import("@mui/material/MobileStepper");
        case "@mui/material/Modal":
            return import("@mui/material/Modal");
        case "@mui/material/NativeSelect":
            return import("@mui/material/NativeSelect");
        case "@mui/material/NoSsr":
            return import("@mui/material/NoSsr");
        case "@mui/material/OutlinedInput":
            return import("@mui/material/OutlinedInput");
        case "@mui/material/OverridableComponent":
            return import("@mui/material/OverridableComponent");
        case "@mui/material/Pagination":
            return import("@mui/material/Pagination");
        case "@mui/material/PaginationItem":
            return import("@mui/material/PaginationItem");
        case "@mui/material/Paper":
            return import("@mui/material/Paper");
        case "@mui/material/PigmentContainer":
            return import("@mui/material/PigmentContainer");
        case "@mui/material/PigmentGrid":
            return import("@mui/material/PigmentGrid");
        case "@mui/material/PigmentHidden":
            return import("@mui/material/PigmentHidden");
        case "@mui/material/PigmentStack":
            return import("@mui/material/PigmentStack");
        case "@mui/material/Popover":
            return import("@mui/material/Popover");
        case "@mui/material/Popper":
            return import("@mui/material/Popper");
        case "@mui/material/Portal":
            return import("@mui/material/Portal");
        case "@mui/material/Radio":
            return import("@mui/material/Radio");
        case "@mui/material/RadioGroup":
            return import("@mui/material/RadioGroup");
        case "@mui/material/Rating":
            return import("@mui/material/Rating");
        case "@mui/material/ScopedCssBaseline":
            return import("@mui/material/ScopedCssBaseline");
        case "@mui/material/Select":
            return import("@mui/material/Select");
        case "@mui/material/Skeleton":
            return import("@mui/material/Skeleton");
        case "@mui/material/Slide":
            return import("@mui/material/Slide");
        case "@mui/material/Slider":
            return import("@mui/material/Slider");
        case "@mui/material/Snackbar":
            return import("@mui/material/Snackbar");
        case "@mui/material/SnackbarContent":
            return import("@mui/material/SnackbarContent");
        case "@mui/material/SpeedDial":
            return import("@mui/material/SpeedDial");
        case "@mui/material/SpeedDialAction":
            return import("@mui/material/SpeedDialAction");
        case "@mui/material/SpeedDialIcon":
            return import("@mui/material/SpeedDialIcon");
        case "@mui/material/Stack":
            return import("@mui/material/Stack");
        case "@mui/material/Step":
            return import("@mui/material/Step");
        case "@mui/material/StepButton":
            return import("@mui/material/StepButton");
        case "@mui/material/StepConnector":
            return import("@mui/material/StepConnector");
        case "@mui/material/StepContent":
            return import("@mui/material/StepContent");
        case "@mui/material/StepIcon":
            return import("@mui/material/StepIcon");
        case "@mui/material/StepLabel":
            return import("@mui/material/StepLabel");
        case "@mui/material/Stepper":
            return import("@mui/material/Stepper");
        case "@mui/material/StyledEngineProvider":
            return import("@mui/material/StyledEngineProvider");
        case "@mui/material/styles":
            return import("@mui/material/styles");
        case "@mui/material/SvgIcon":
            return import("@mui/material/SvgIcon");
        case "@mui/material/SwipeableDrawer":
            return import("@mui/material/SwipeableDrawer");
        case "@mui/material/Switch":
            return import("@mui/material/Switch");
        case "@mui/material/Tab":
            return import("@mui/material/Tab");
        case "@mui/material/Table":
            return import("@mui/material/Table");
        case "@mui/material/TableBody":
            return import("@mui/material/TableBody");
        case "@mui/material/TableCell":
            return import("@mui/material/TableCell");
        case "@mui/material/TableContainer":
            return import("@mui/material/TableContainer");
        case "@mui/material/TableFooter":
            return import("@mui/material/TableFooter");
        case "@mui/material/TableHead":
            return import("@mui/material/TableHead");
        case "@mui/material/TablePagination":
            return import("@mui/material/TablePagination");
        case "@mui/material/TableRow":
            return import("@mui/material/TableRow");
        case "@mui/material/TableSortLabel":
            return import("@mui/material/TableSortLabel");
        case "@mui/material/Tabs":
            return import("@mui/material/Tabs");
        case "@mui/material/TabScrollButton":
            return import("@mui/material/TabScrollButton");
        case "@mui/material/TextareaAutosize":
            return import("@mui/material/TextareaAutosize");
        case "@mui/material/TextField":
            return import("@mui/material/TextField");
        case "@mui/material/ToggleButton":
            return import("@mui/material/ToggleButton");
        case "@mui/material/ToggleButtonGroup":
            return import("@mui/material/ToggleButtonGroup");
        case "@mui/material/Toolbar":
            return import("@mui/material/Toolbar");
        case "@mui/material/Tooltip":
            return import("@mui/material/Tooltip");
        case "@mui/material/transitions":
            return import("@mui/material/transitions");
        case "@mui/material/Typography":
            return import("@mui/material/Typography");
        case "@mui/material/Unstable_TrapFocus":
            return import("@mui/material/Unstable_TrapFocus");
        case "@mui/material/useAutocomplete":
            return import("@mui/material/useAutocomplete");
        case "@mui/material/useLazyRipple":
            return import("@mui/material/useLazyRipple");
        case "@mui/material/useMediaQuery":
            return import("@mui/material/useMediaQuery");
        case "@mui/material/usePagination":
            return import("@mui/material/usePagination");
        case "@mui/material/useScrollTrigger":
            return import("@mui/material/useScrollTrigger");
        case "@mui/material/utils":
            return import("@mui/material/utils");
        case "@mui/material/version":
            return import("@mui/material/version");
        case "@mui/material/zero-styled":
            return import("@mui/material/zero-styled");
        case "@mui/material/Zoom":
            return import("@mui/material/Zoom");
        default:
            assert<Equals<typeof moduleName, never>>(
                false,
                `${moduleName} is not a module exposed by Onyxia.`
            );
    }
}
