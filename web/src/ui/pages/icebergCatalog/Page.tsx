import { useEffect } from "react";
import { PageHeader } from "onyxia-ui/PageHeader";
import { getIconUrlByName } from "lazy-icons";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { withLoader } from "ui/tools/withLoader";
import { enforceLogin } from "ui/shared/enforceLogin";
import { useCoreState, getCoreSync } from "core";
import { IcebergCatalogs } from "./IcebergCatalogs";

const Page = withLoader({
    loader: enforceLogin,
    Component: IcebergCatalogPage
});

function IcebergCatalogPage() {
    const { classes } = useStyles();
    const { catalogs, isLoading, selectedTable } = useCoreState("icebergCatalog", "view");

    const {
        functions: { icebergCatalog }
    } = getCoreSync();

    useEffect(() => {
        icebergCatalog.initialize();
    }, []);

    return (
        <div className={classes.root}>
            <PageHeader
                mainIcon={getIconUrlByName("Storage")}
                title="Iceberg Catalog"
                helpContent={
                    <Text typo="body 1">
                        Browse catalogs, their namespaces, and Iceberg tables, then open
                        any table in the data explorer.
                    </Text>
                }
            />
            <div className={classes.content}>
                <IcebergCatalogs
                    catalogs={catalogs}
                    isLoading={isLoading}
                    selectedTable={selectedTable}
                    onSelectTable={icebergCatalog.selectTable}
                />
            </div>
        </div>
    );
}

export default Page;

const useStyles = tss.withName({ IcebergCatalogPage }).create(({ theme }) => ({
    root: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
    },
    content: {
        flex: 1,
        overflow: "auto",
        paddingBottom: theme.spacing(4)
    }
}));
