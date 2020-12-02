import React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { ServiceBadge } from "./ServiceBadge";
import type { Props as ServiceBadgeProps } from "./ServiceBadge";
import { id } from "evt/tools/typeSafety/id";

const serviceBadgesType = id<ServiceBadgeProps["type"][]>(
    [
        "vscode" , "rstudio" , "blazingsql" , "elk" , "gitlab" , "gravitee",
        "jena" , "jupyter" , "keycloak" , "minio" , "mongodb", "neo4j" , "openrefine",
        "plutojl" , "postgresql" , "rapidsai" , "tensorflow" , "ubuntu", "vault" , "zeppelin"
    ]
);

const useStyles = makeStyles(theme =>
    createStyles({
        "root": {
            "& > svg": {
                "margin": theme.spacing(2)
            }
        }
    })
);

export function ServiceBadgeOverview() {

    const classes = useStyles();

    return (
        <>
            {serviceBadgesType.map(type => (
                <>
                    <h3><code>{`<ServiceBadge type="${type}"/>`}</code></h3>
                    <div className={classes.root} key={type}>
                        <ServiceBadge type={type}/>
                    </div>
                </>
            ))}
        </>
        
    );
}