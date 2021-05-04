import { memo } from "react";

import { createUseClassNames } from "app/theme/useClassNames";
import { routes } from "app/router";
import type { Route } from "type-route";
import { cx } from "tss-react";


export type Props = {
    className?: string;
    route: Route<typeof routes.catalogLauncher>;
};

const { useClassNames } = createUseClassNames()(
    () => ({
        "root": {
            "border": "1px solid red"
        }
    })
);

export const CatalogLauncher = memo((props: Props) => {

    const { className, route } = props;

    const { classNames } = useClassNames({});

    return (
        <div
            className={cx(classNames.root, className)}
        >
            {route.params.catalogId}<br/>
            {route.params.serviceId}<br/>
            {JSON.stringify(route.params.params, null, 2)}

        </div>
    );

});