/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { execSync } from "child_process";
import { join as pathJoin, relative as pathRelative } from "path";
import * as fs from "fs";

const webAppProjectRootDirPath = pathJoin(__dirname, "..", "..");

const commonThirdPartyDeps = (() => {
    const namespaceModuleNames = ["@emotion", "@material-ui"];
    const standaloneModuleNames = ["react", "@types/react"];

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

const inHouseModuleNames = ["onyxia-ui", "powerhooks", "tss-react", "evt"];

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
