

import React from "react";
import Avatar from "@material-ui/core/Avatar";
import type { AvatarProps } from "@material-ui/core/Avatar";
import vscodeImg from "app/res/img/vscode.png";
import rstudioImg from "app/res/img/rstudio.png";
import blazingsqlImg from "app/res/img/blazingsql.png";
import elkImg from "app/res/img/elk.png";
import gitlabImg from "app/res/img/gitlab.png";
import graviteeImg from "app/res/img/gravitee.png";
import jenaImg from "app/res/img/jena.png";
import jupyterImg from "app/res/img/jupyter.png";
import keycloakImg from "app/res/img/keycloak.png";
import minioImg from "app/res/img/minio.png";
import mongodbImg from "app/res/img/mongodb.png";
import neo4jImg from "app/res/img/neo4j.png";
import openrefineImg from "app/res/img/openrefine.png";
import plutojlImg from "app/res/img/plutojl.png";
import postgresqlImg from "app/res/img/postgresql.png";
import rapidsaiImg from "app/res/img/rapidsai.png";
import tensorflowImg from "app/res/img/tensorflow.png";
import ubuntuImg from "app/res/img/ubuntu.png";
import vaultImg from "app/res/img/vault.png";
import zeppelinImg from "app/res/img/zeppelin.png";


export type Props = AvatarProps & {
    type: "vscode" | "rstudio" | "blazingsql" | "elk" | "gitlab" | "gravitee"
    | "jena" | "jupyter" | "keycloak" | "minio" | "mongodb"| "neo4j" | "openrefine"
    | "plutojl" | "postgresql" | "rapidsai" | "tensorflow" | "ubuntu"| "vault" | "zeppelin";
};

export function ServiceBadge(props: Props) {

    const { type, ...avatarProps } = props;

    return <Avatar  {...avatarProps} alt={type} src={(() => {
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