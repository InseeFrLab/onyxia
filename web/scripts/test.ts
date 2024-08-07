import * as child_process from "child_process";

run("npx tsx src/core/usecases/launcher/utils/resolveXOnyxiaValueReference.test.ts");
run("npx tsx src/core/usecases/launcher/utils/getHelmValues_default.test.ts");

function run(cmd: string) {
    console.log(`$ ${cmd}`);
    console.log(child_process.execSync(cmd).toString("utf8"));
}
