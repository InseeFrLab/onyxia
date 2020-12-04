
import React from "react";
import Avatar from "@material-ui/core/Avatar";
import vscodeImg from "app/assets/img/vscode.png";
import rstudioImg from "app/assets/img/rstudio.png";
import blazingsqlImg from "app/assets/img/blazingsql.png";
import elkImg from "app/assets/img/elk.png";
import gitlabImg from "app/assets/img/gitlab.png";
import graviteeImg from "app/assets/img/gravitee.png";
import jenaImg from "app/assets/img/jena.png";
import jupyterImg from "app/assets/img/jupyter.png";
import keycloakImg from "app/assets/img/keycloak.png";
import minioImg from "app/assets/img/minio.png";
import mongodbImg from "app/assets/img/mongodb.png";
import neo4jImg from "app/assets/img/neo4j.png";
import openrefineImg from "app/assets/img/openrefine.png";
import plutojlImg from "app/assets/img/plutojl.png";
import postgresqlImg from "app/assets/img/postgresql.png";
import rapidsaiImg from "app/assets/img/rapidsai.png";
import tensorflowImg from "app/assets/img/tensorflow.png";
import ubuntuImg from "app/assets/img/ubuntu.png";
import vaultImg from "app/assets/img/vault.png";
import zeppelinImg from "app/assets/img/zeppelin.png";


export type Props = {
    /** Design which service image should be displayed */
    type: "vscode" | "rstudio" | "blazingsql" | "elk" | "gitlab" | "gravitee"
    | "jena" | "jupyter" | "keycloak" | "minio" | "mongodb"| "neo4j" | "openrefine"
    | "plutojl" | "postgresql" | "rapidsai" | "tensorflow" | "ubuntu"| "vault" | "zeppelin";
};

export function ServiceBadge(props: Props) {

    const { type } = props;

    return <Avatar alt={type} src={(() => {
        switch (type) {
            case "vscode": return vscodeImg;
            case "rstudio": return rstudioImg;
            case "blazingsql": return blazingsqlImg;
            case "gitlab": return gitlabImg;
            case "elk": return elkImg;
            case "gravitee": return graviteeImg;
            case "jena": return jenaImg;
            case "jupyter": return jupyterImg;
            case "keycloak": return keycloakImg;
            case "minio": return minioImg;
            case "mongodb": return mongodbImg;
            case "neo4j": return neo4jImg;
            case "openrefine": return openrefineImg;
            case "plutojl": return plutojlImg;
            case "postgresql": return postgresqlImg;
            case "rapidsai": return rapidsaiImg;
            case "tensorflow": return tensorflowImg;
            case "ubuntu": return ubuntuImg;
            case "vault": return vaultImg;
            case "zeppelin": return zeppelinImg;
        }
    })()} />;

}