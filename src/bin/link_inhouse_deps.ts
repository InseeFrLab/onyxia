/* eslint-disable @typescript-eslint/no-non-null-assertion */

/*
This script enable to link the module we develop inhouse ("onyxia-ui", "powerhooks", "tss-react", "evt").
Without it, if we want for example to add a new component to onyxia-ui we have publish a new version
before being able to test it in the project. 

By default the script will link all the libraries we have control over, 
so, if you like to link them all, you should have the following directory structure

onyxia-web/
tss-react/
powerhooks/
onyxia-ui/
keycloakify/
evt/
cra-envs/
tsafe/
redux-clean-architecture/

you must have cloned all the projects and run:
yarn && yarn build 
in every directory.

then after you can
cd onyxia-web
yarn link_inhouse_deps

If you only want to link some specific package you can do, for example:
yarn link_inhouse_deps onyxia-ui tss-react

When you change what's linked it is a good idea to first:
rm -rf node_modules .yarn_home
yarn

In the repo you are working on (for example onyxia-ui) you probably want to run
npx tsc -w
to enable realtime compilation. 
*/
import { execSync } from "child_process";
import { join as pathJoin, relative as pathRelative } from "path";
import * as fs from "fs";

const webAppProjectRootDirPath = pathJoin(__dirname, "..", "..");

const inHouseModulePeerDepNames = ["powerhooks", "tss-react"];

const inHouseModuleNames = (() => {
    const inHouseModuleNamesFromArgv = process.argv.slice(2);

    return inHouseModuleNamesFromArgv.length !== 0
        ? inHouseModuleNamesFromArgv
        : [
              ...inHouseModulePeerDepNames,
              "onyxia-ui",
              "keycloakify",
              "evt",
              "tsafe",
              "cra-envs",
              "redux-clean-architecture",
          ];
})();

console.log(`Linking following modules: ${inHouseModuleNames.join(" ")}`);

const commonThirdPartyDeps = (() => {
    const namespaceModuleNames = ["@emotion", "@mui"];
    const standaloneModuleNames = [
        "react",
        "@types/react",
        ...inHouseModulePeerDepNames.filter(
            moduleName => !inHouseModuleNames.includes(moduleName),
        ),
    ];

    return [
        ...namespaceModuleNames
            .map(namespaceModuleName =>
                fs
                    .readdirSync(
                        pathJoin(
                            webAppProjectRootDirPath,
                            "node_modules",
                            namespaceModuleName,
                        ),
                    )
                    .map(submoduleName => `${namespaceModuleName}/${submoduleName}`),
            )
            .reduce((prev, curr) => [...prev, ...curr], []),
        ...standaloneModuleNames,
    ];
})();

const yarnHomeDirPath = pathJoin(webAppProjectRootDirPath, ".yarn_home");

execSync(["rm -rf", "mkdir"].map(cmd => `${cmd} ${yarnHomeDirPath}`).join(" && "));

const execYarnLink = (params: { targetModuleName?: string; cwd: string }) => {
    const { targetModuleName, cwd } = params;

    const cmd = [
        "yarn",
        "link",
        ...(targetModuleName !== undefined ? [targetModuleName] : []),
    ].join(" ");

    console.log(`$ cd ${pathRelative(webAppProjectRootDirPath, cwd) || "."} && ${cmd}`);

    execSync(cmd, {
        cwd,
        "env": {
            ...process.env,
            "HOME": yarnHomeDirPath,
        },
    });
};

console.log("=== Linking common dependencies ===");

const total = commonThirdPartyDeps.length;
let current = 0;

commonThirdPartyDeps.forEach(commonThirdPartyDep => {
    current++;

    console.log(`${current}/${total} ${commonThirdPartyDep}`);

    const localInstallPath = pathJoin(
        ...[
            webAppProjectRootDirPath,
            "node_modules",
            ...(commonThirdPartyDep.startsWith("@")
                ? commonThirdPartyDep.split("/")
                : [commonThirdPartyDep]),
        ],
    );

    execYarnLink({ "cwd": localInstallPath });

    inHouseModuleNames.forEach(inHouseModuleName =>
        execYarnLink({
            "targetModuleName": commonThirdPartyDep,
            "cwd": pathJoin(webAppProjectRootDirPath, "..", inHouseModuleName),
        }),
    );
});

console.log("=== Linking in house dependencies ===");

inHouseModuleNames.forEach(inHouseModuleName => {
    const inHouseModuleRootPath = pathJoin(
        webAppProjectRootDirPath,
        "..",
        inHouseModuleName,
    );

    fs.writeFileSync(
        pathJoin(inHouseModuleRootPath, "dist", "package.json"),
        Buffer.from(
            JSON.stringify(
                (() => {
                    const packageJsonParsed = JSON.parse(
                        fs
                            .readFileSync(pathJoin(inHouseModuleRootPath, "package.json"))
                            .toString("utf8"),
                    );

                    return {
                        ...packageJsonParsed,
                        "main": packageJsonParsed["main"].replace(/^dist\//, ""),
                        "types": packageJsonParsed["types"].replace(/^dist\//, ""),
                    };
                })(),
                null,
                2,
            ),
            "utf8",
        ),
    );
});

inHouseModuleNames.forEach(inHouseModuleName =>
    execYarnLink({
        "cwd": pathJoin(webAppProjectRootDirPath, "..", inHouseModuleName, "dist"),
    }),
);

console.log("=== Linking in house dependencies to one another ===");

inHouseModuleNames.forEach(inHouseModuleNameOuter =>
    inHouseModuleNames
        .filter(
            inHouseModuleNameInner => inHouseModuleNameInner !== inHouseModuleNameOuter,
        )
        .forEach(inHouseModuleNameInner =>
            execYarnLink({
                "targetModuleName": inHouseModuleNameInner,
                "cwd": pathJoin(webAppProjectRootDirPath, "..", inHouseModuleNameOuter),
            }),
        ),
);

console.log("=== Linking in house dependencies in web app ===");

inHouseModuleNames.forEach(inHouseModuleName => {
    execYarnLink({
        "targetModuleName": inHouseModuleName,
        "cwd": webAppProjectRootDirPath,
    });
});
