import * as yaml from "yaml";
import { join as pathJoin } from "path";
import * as fs from "fs";

const projectRootPath = pathJoin(__dirname, "..");

const parsedEnvLocalYaml: { onyxia: { web: { env: Record<string, string> } } } =
    yaml.parse(
        fs.readFileSync(pathJoin(projectRootPath, ".env.local.yaml")).toString("utf8")
    );

fs.writeFileSync(
    pathJoin(projectRootPath, ".env.local"),
    Buffer.from(
        Object.entries(parsedEnvLocalYaml.onyxia.web.env)
            .map(([key, value]) => `REACT_APP_${key}=${value.replace(/\n/g, "")}`)
            .join("\n"),
        "utf8"
    )
);
