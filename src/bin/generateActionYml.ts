
import * as fs from "fs";
import * as path from "path";
import { inputNames, getInputDescription, getInputDefault } from "../inputHelper";
import { outputNames, getOutputDescription } from "../outputHelper";

const projectRoot = path.join(__dirname, "..", "..");

const packageJsonParsed = require(path.join(projectRoot, "package.json"));

fs.writeFileSync(
    path.join(projectRoot, "action.yml"),
    Buffer.from([
        `name: '${packageJsonParsed["name"]}'`,
        `description: '${packageJsonParsed["description"]}'`,
        `author: '${packageJsonParsed["author"]}'`,
        `inputs:`,
        ...inputNames.map((inputName, i) => [
            `  ${inputName}:`,
            `    required: ${i === 0 ? "true" : "false"}`,
            `    description: '${getInputDescription(inputName).replace(/'/g,"''")}'`,
            ...[getInputDefault(inputName)].filter(x=>x!==undefined).map(s=>`    default: '${s}'`)
        ].join("\n")),
        ...(outputNames.length === 0 ? [] : [`outputs:`]),
        ...outputNames.map((outputName, i) => [
            `  ${outputName}:`,
            `    description: '${getOutputDescription(outputName).replace(/'/g,"''")}'`
        ].join("\n")),
        `runs:`,
        `  using: 'node12'`,
        `  main: 'dist/index.js'`
    ].join("\n"), "utf8")
);
